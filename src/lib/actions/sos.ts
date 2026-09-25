"use server";

import {
  getActiveStudentContext,
  writeBlockedResult,
} from "@/lib/student-context";
import { SosStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  SOS_MAX_ACTIVE,
  SOS_PROLONG_DAYS,
  SOS_TTL_DAYS,
  addDays,
  formatUntilLabel,
} from "@/lib/board-ttl";

export type SosItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  timeLabel: string;
  expiresLabel: string;
  status: "open" | "helped" | "closed" | "expired";
  helpers: number;
  iHelped: boolean;
  isMine: boolean;
  canProlong: boolean;
};

export type SosActionResult =
  | { ok: true; item?: SosItem }
  | { ok: false; error: string };

const ACTIVE_STATUSES: SosStatus[] = [SosStatus.OPEN, SosStatus.HELPED];

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

function mapStatus(status: SosStatus): SosItem["status"] {
  switch (status) {
    case SosStatus.OPEN:
      return "open";
    case SosStatus.HELPED:
      return "helped";
    case SosStatus.CLOSED:
      return "closed";
    case SosStatus.EXPIRED:
      return "expired";
  }
}

function mapSos(
  row: {
    id: string;
    title: string;
    description: string;
    status: SosStatus;
    createdAt: Date;
    expiresAt: Date;
    prolongedOnce: boolean;
    authorId: string;
    author: { firstName: string; lastName: string };
    helpers: { userId: string }[];
  },
  userId: string,
): SosItem {
  const isMine = row.authorId === userId;
  const active = ACTIVE_STATUSES.includes(row.status);
  const canReviveExpired = row.status === SosStatus.EXPIRED;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: `${row.author.firstName} ${row.author.lastName.charAt(0)}.`,
    authorId: row.authorId,
    timeLabel: formatRelative(row.createdAt),
    expiresLabel: formatUntilLabel(row.expiresAt),
    status: mapStatus(row.status),
    helpers: row.helpers.length,
    iHelped: row.helpers.some((h) => h.userId === userId),
    isMine,
    canProlong:
      isMine &&
      !row.prolongedOnce &&
      (active || canReviveExpired),
  };
}

const sosInclude = {
  author: { select: { firstName: true, lastName: true } },
  helpers: { select: { userId: true } },
} as const;

async function expireDueSos(residenceId: string) {
  await prisma.sosRequest.updateMany({
    where: {
      residenceId,
      status: { in: ACTIVE_STATUSES },
      expiresAt: { lt: new Date() },
    },
    data: { status: SosStatus.EXPIRED },
  });
}

export async function listResidenceSos(): Promise<SosItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  await expireDueSos(ctx.residenceId);

  const rows = await prisma.sosRequest.findMany({
    where: { residenceId: ctx.residenceId },
    include: sosInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((row) => mapSos(row, ctx.session.userId));
}

export async function createSos(input: {
  title: string;
  description: string;
}): Promise<SosActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const title = input.title.trim();
  const description = input.description.trim();
  if (!title) return { ok: false, error: "Décris le besoin en une phrase." };
  if (!description) {
    return { ok: false, error: "Ajoute un détail pour qu’on puisse t’aider." };
  }

  await expireDueSos(ctx.residenceId);

  const activeCount = await prisma.sosRequest.count({
    where: {
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
      status: { in: ACTIVE_STATUSES },
      expiresAt: { gt: new Date() },
    },
  });
  if (activeCount >= SOS_MAX_ACTIVE) {
    return {
      ok: false,
      error: `Tu as déjà ${SOS_MAX_ACTIVE} SOS en cours. Marque-en un comme résolu ou attends qu’il expire.`,
    };
  }

  const row = await prisma.sosRequest.create({
    data: {
      title,
      description,
      status: SosStatus.OPEN,
      expiresAt: addDays(new Date(), SOS_TTL_DAYS),
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
    include: sosInclude,
  });

  revalidatePath("/sos");
  revalidatePath("/accueil");

  return { ok: true, item: mapSos(row, ctx.session.userId) };
}

export async function toggleSosHelp(sosId: string): Promise<SosActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  await expireDueSos(ctx.residenceId);

  const sos = await prisma.sosRequest.findFirst({
    where: { id: sosId, residenceId: ctx.residenceId },
    include: sosInclude,
  });

  if (!sos) return { ok: false, error: "SOS introuvable." };
  if (sos.status === SosStatus.CLOSED) {
    return { ok: false, error: "Ce SOS est déjà résolu." };
  }
  if (sos.status === SosStatus.EXPIRED) {
    return { ok: false, error: "Ce SOS a expiré." };
  }
  if (sos.authorId === ctx.session.userId) {
    return { ok: false, error: "Tu ne peux pas t’aider toi-même." };
  }

  const already = sos.helpers.some((h) => h.userId === ctx.session.userId);

  if (already) {
    await prisma.sosHelp.delete({
      where: {
        sosId_userId: { sosId: sos.id, userId: ctx.session.userId },
      },
    });
  } else {
    await prisma.sosHelp.create({
      data: { sosId: sos.id, userId: ctx.session.userId },
    });
  }

  const helpersCount = await prisma.sosHelp.count({ where: { sosId: sos.id } });
  const nextStatus = helpersCount > 0 ? SosStatus.HELPED : SosStatus.OPEN;

  await prisma.sosRequest.update({
    where: { id: sos.id },
    data: { status: nextStatus },
  });

  const refreshed = await prisma.sosRequest.findUniqueOrThrow({
    where: { id: sos.id },
    include: sosInclude,
  });

  revalidatePath("/sos");
  revalidatePath("/accueil");

  return { ok: true, item: mapSos(refreshed, ctx.session.userId) };
}

export async function resolveSos(sosId: string): Promise<SosActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const sos = await prisma.sosRequest.findFirst({
    where: {
      id: sosId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });

  if (!sos) {
    return { ok: false, error: "SOS introuvable ou tu n’en es pas l’auteur." };
  }
  if (sos.status === SosStatus.CLOSED) {
    return { ok: false, error: "Ce SOS est déjà résolu." };
  }

  await prisma.sosRequest.update({
    where: { id: sos.id },
    data: { status: SosStatus.CLOSED },
  });

  const refreshed = await prisma.sosRequest.findUniqueOrThrow({
    where: { id: sos.id },
    include: sosInclude,
  });

  revalidatePath("/sos");
  revalidatePath("/accueil");

  return { ok: true, item: mapSos(refreshed, ctx.session.userId) };
}

export async function prolongSos(sosId: string): Promise<SosActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  await expireDueSos(ctx.residenceId);

  const sos = await prisma.sosRequest.findFirst({
    where: {
      id: sosId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });

  if (!sos) {
    return { ok: false, error: "SOS introuvable ou tu n’en es pas l’auteur." };
  }
  if (sos.prolongedOnce) {
    return { ok: false, error: "Tu as déjà prolongé ce SOS une fois." };
  }
  if (sos.status === SosStatus.CLOSED) {
    return { ok: false, error: "Ce SOS est déjà résolu." };
  }
  if (
    sos.status !== SosStatus.OPEN &&
    sos.status !== SosStatus.HELPED &&
    sos.status !== SosStatus.EXPIRED
  ) {
    return { ok: false, error: "Ce SOS ne peut plus être prolongé." };
  }

  if (sos.status === SosStatus.EXPIRED) {
    const activeCount = await prisma.sosRequest.count({
      where: {
        residenceId: ctx.residenceId,
        authorId: ctx.session.userId,
        status: { in: ACTIVE_STATUSES },
        expiresAt: { gt: new Date() },
        NOT: { id: sos.id },
      },
    });
    if (activeCount >= SOS_MAX_ACTIVE) {
      return {
        ok: false,
        error: `Tu as déjà ${SOS_MAX_ACTIVE} SOS en cours. Marque-en un comme résolu avant de prolonger celui-ci.`,
      };
    }
  }

  const base =
    sos.status === SosStatus.EXPIRED || sos.expiresAt.getTime() < Date.now()
      ? new Date()
      : sos.expiresAt;

  const refreshed = await prisma.sosRequest.update({
    where: { id: sos.id },
    data: {
      expiresAt: addDays(base, SOS_PROLONG_DAYS),
      prolongedOnce: true,
      status:
        sos.status === SosStatus.EXPIRED ? SosStatus.OPEN : sos.status,
    },
    include: sosInclude,
  });

  revalidatePath("/sos");
  revalidatePath("/accueil");

  return { ok: true, item: mapSos(refreshed, ctx.session.userId) };
}
