"use server";

import {
  MembershipStatus,
  ReportStatus,
  ReportTargetType,
  Role,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type ReportListItem = {
  id: string;
  targetType: "event" | "sos" | "recyclerie" | "message";
  targetId: string;
  targetLabel: string;
  /** Description / corps du contenu signalé (snapshot). */
  targetBody: string;
  reason: string;
  reporter: string;
  reportedAt: string;
  status: "open" | "removed" | "dismissed";
};

export type ModerationActionResult =
  | { ok: true; item?: ReportListItem }
  | { ok: false; error: string };

async function getActiveStudentContext() {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) return null;

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) return null;

  return { session, residenceId: membership.residenceId };
}

async function getManagerResidenceId(userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN) {
    const residence = await prisma.residence.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    return residence?.id ?? null;
  }

  const residence = await prisma.residence.findFirst({
    where: { managerId: userId },
    select: { id: true },
  });
  return residence?.id ?? null;
}

function formatRelative(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "À l’instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} j`;
}

function mapType(type: ReportTargetType): ReportListItem["targetType"] {
  switch (type) {
    case ReportTargetType.EVENT:
      return "event";
    case ReportTargetType.SOS:
      return "sos";
    case ReportTargetType.RECYCLERIE:
      return "recyclerie";
    case ReportTargetType.MESSAGE:
      return "message";
  }
}

function mapStatus(status: ReportStatus): ReportListItem["status"] {
  switch (status) {
    case ReportStatus.OPEN:
      return "open";
    case ReportStatus.REMOVED:
      return "removed";
    case ReportStatus.DISMISSED:
      return "dismissed";
  }
}

function mapReport(row: {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel: string;
  targetBody: string;
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  reporter: { firstName: string; lastName: string };
}): ReportListItem {
  return {
    id: row.id,
    targetType: mapType(row.targetType),
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    targetBody: row.targetBody.trim(),
    reason: row.reason,
    reporter: `${row.reporter.firstName} ${row.reporter.lastName.charAt(0)}.`,
    reportedAt: formatRelative(row.createdAt),
    status: mapStatus(row.status),
  };
}

async function resolveTargetSnapshot(
  targetType: ReportTargetType,
  targetId: string,
  residenceId: string,
): Promise<{ label: string; body: string } | null> {
  switch (targetType) {
    case ReportTargetType.EVENT: {
      const event = await prisma.microEvent.findFirst({
        where: { id: targetId, residenceId },
        select: { title: true, description: true },
      });
      return event
        ? { label: event.title, body: event.description }
        : null;
    }
    case ReportTargetType.SOS: {
      const sos = await prisma.sosRequest.findFirst({
        where: { id: targetId, residenceId },
        select: { title: true, description: true },
      });
      return sos ? { label: sos.title, body: sos.description } : null;
    }
    case ReportTargetType.RECYCLERIE: {
      const item = await prisma.marketplaceItem.findFirst({
        where: { id: targetId, residenceId },
        select: { title: true, description: true },
      });
      return item ? { label: item.title, body: item.description } : null;
    }
    case ReportTargetType.MESSAGE: {
      const message = await prisma.message.findFirst({
        where: { id: targetId },
        include: { conversation: { select: { residenceId: true } } },
      });
      if (!message || message.conversation.residenceId !== residenceId) {
        return null;
      }
      return { label: "Message privé", body: message.body };
    }
  }
}

const reportInclude = {
  reporter: { select: { firstName: true, lastName: true } },
} as const;

function toPrismaType(
  type: ReportListItem["targetType"],
): ReportTargetType {
  switch (type) {
    case "event":
      return ReportTargetType.EVENT;
    case "sos":
      return ReportTargetType.SOS;
    case "recyclerie":
      return ReportTargetType.RECYCLERIE;
    case "message":
      return ReportTargetType.MESSAGE;
  }
}

export async function listResidenceReports(): Promise<ReportListItem[]> {
  const session = await getSession();
  if (!session) return [];
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return [];
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) return [];

  const rows = await prisma.moderationReport.findMany({
    where: { residenceId },
    include: reportInclude,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const items = await Promise.all(
    rows.map(async (row) => {
      const mapped = mapReport(row);
      if (mapped.targetBody) return mapped;

      // Anciens signalements : compléter avec le contenu encore en base
      const live = await resolveTargetSnapshot(
        row.targetType,
        row.targetId,
        residenceId,
      );
      if (!live) return mapped;
      return {
        ...mapped,
        targetLabel: mapped.targetLabel || live.label,
        targetBody: live.body.trim(),
      };
    }),
  );

  return items;
}

export async function createReport(input: {
  targetType: ReportListItem["targetType"];
  targetId: string;
  reason: string;
}): Promise<ModerationActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const reason = input.reason.trim();
  if (!reason) return { ok: false, error: "Indique un motif de signalement." };
  if (reason.length > 500) {
    return { ok: false, error: "Motif trop long (max 500 caractères)." };
  }

  const targetType = toPrismaType(input.targetType);
  let targetLabel = "";
  let targetBody = "";
  let authorId: string | null = null;

  if (input.targetType === "event") {
    const event = await prisma.microEvent.findFirst({
      where: { id: input.targetId, residenceId: ctx.residenceId },
    });
    if (!event) return { ok: false, error: "Événement introuvable." };
    targetLabel = event.title;
    targetBody = event.description;
    authorId = event.authorId;
  } else if (input.targetType === "sos") {
    const sos = await prisma.sosRequest.findFirst({
      where: { id: input.targetId, residenceId: ctx.residenceId },
    });
    if (!sos) return { ok: false, error: "SOS introuvable." };
    targetLabel = sos.title;
    targetBody = sos.description;
    authorId = sos.authorId;
  } else if (input.targetType === "recyclerie") {
    const item = await prisma.marketplaceItem.findFirst({
      where: { id: input.targetId, residenceId: ctx.residenceId },
    });
    if (!item) return { ok: false, error: "Annonce introuvable." };
    targetLabel = item.title;
    targetBody = item.description;
    authorId = item.authorId;
  } else {
    const message = await prisma.message.findFirst({
      where: { id: input.targetId },
      include: { conversation: true },
    });
    if (
      !message ||
      message.conversation.residenceId !== ctx.residenceId ||
      (message.conversation.userAId !== ctx.session.userId &&
        message.conversation.userBId !== ctx.session.userId)
    ) {
      return { ok: false, error: "Message introuvable." };
    }
    targetLabel = "Message privé";
    targetBody = message.body;
    authorId = message.senderId;
  }

  if (authorId === ctx.session.userId) {
    return { ok: false, error: "Tu ne peux pas signaler ton propre contenu." };
  }

  const already = await prisma.moderationReport.findFirst({
    where: {
      residenceId: ctx.residenceId,
      reporterId: ctx.session.userId,
      targetType,
      targetId: input.targetId,
      status: ReportStatus.OPEN,
    },
  });

  if (already) {
    return { ok: false, error: "Tu as déjà signalé ce contenu." };
  }

  const row = await prisma.moderationReport.create({
    data: {
      targetType,
      targetId: input.targetId,
      targetLabel,
      targetBody,
      reason,
      status: ReportStatus.OPEN,
      residenceId: ctx.residenceId,
      reporterId: ctx.session.userId,
    },
    include: reportInclude,
  });

  revalidatePath("/gestionnaire");
  revalidatePath("/gestionnaire/moderation");

  return { ok: true, item: mapReport(row) };
}

export async function resolveReport(
  reportId: string,
  action: "removed" | "dismissed",
): Promise<ModerationActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Action non autorisée." };
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) {
    return { ok: false, error: "Aucune résidence liée." };
  }

  const report = await prisma.moderationReport.findFirst({
    where: {
      id: reportId,
      residenceId,
      status: ReportStatus.OPEN,
    },
  });

  if (!report) {
    return { ok: false, error: "Signalement introuvable ou déjà traité." };
  }

  if (action === "removed") {
    await removeTargetContent(report.targetType, report.targetId, residenceId);
  }

  const nextStatus =
    action === "removed" ? ReportStatus.REMOVED : ReportStatus.DISMISSED;

  await prisma.moderationReport.update({
    where: { id: report.id },
    data: { status: nextStatus },
  });

  // Close sibling open reports on the same target
  await prisma.moderationReport.updateMany({
    where: {
      residenceId,
      targetType: report.targetType,
      targetId: report.targetId,
      status: ReportStatus.OPEN,
      id: { not: report.id },
    },
    data: {
      status:
        action === "removed" ? ReportStatus.REMOVED : ReportStatus.DISMISSED,
    },
  });

  const refreshed = await prisma.moderationReport.findUniqueOrThrow({
    where: { id: report.id },
    include: reportInclude,
  });

  revalidatePath("/gestionnaire");
  revalidatePath("/gestionnaire/moderation");
  revalidatePath("/accueil");
  revalidatePath("/evenements");
  revalidatePath("/sos");
  revalidatePath("/recyclerie");
  revalidatePath("/messages");

  return { ok: true, item: mapReport(refreshed) };
}

async function removeTargetContent(
  targetType: ReportTargetType,
  targetId: string,
  residenceId: string,
) {
  switch (targetType) {
    case ReportTargetType.EVENT:
      await prisma.microEvent.deleteMany({
        where: { id: targetId, residenceId },
      });
      break;
    case ReportTargetType.SOS:
      await prisma.sosRequest.deleteMany({
        where: { id: targetId, residenceId },
      });
      break;
    case ReportTargetType.RECYCLERIE:
      await prisma.marketplaceItem.deleteMany({
        where: { id: targetId, residenceId },
      });
      break;
    case ReportTargetType.MESSAGE: {
      const message = await prisma.message.findFirst({
        where: { id: targetId },
        include: { conversation: true },
      });
      if (
        message &&
        message.conversation.residenceId === residenceId
      ) {
        await prisma.message.delete({ where: { id: message.id } });
        await prisma.conversation.update({
          where: { id: message.conversationId },
          data: { updatedAt: new Date() },
        });
      }
      break;
    }
  }
}
