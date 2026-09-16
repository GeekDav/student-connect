"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type MembershipListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: string;
  fieldOfStudy: string;
  school: string;
  requestedAt: string;
  status: "pending" | "accepted" | "refused";
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mapStatus(status: MembershipStatus): MembershipListItem["status"] {
  switch (status) {
    case MembershipStatus.PENDING:
      return "pending";
    case MembershipStatus.ACTIVE:
      return "accepted";
    case MembershipStatus.REFUSED:
      return "refused";
    default:
      return "refused";
  }
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

export async function listResidenceMemberships(): Promise<MembershipListItem[]> {
  const session = await getSession();
  if (!session) return [];
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return [];
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) return [];

  const rows = await prisma.residenceMembership.findMany({
    where: {
      residenceId,
      status: {
        in: [
          MembershipStatus.PENDING,
          MembershipStatus.ACTIVE,
          MembershipStatus.REFUSED,
        ],
      },
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    email: row.user.email,
    roomNumber: row.user.roomNumber ?? "—",
    fieldOfStudy: row.user.fieldOfStudy ?? "—",
    school: row.user.school ?? "—",
    requestedAt: formatDate(row.createdAt),
    status: mapStatus(row.status),
  }));
}

export type DecideResult =
  | { ok: true }
  | { ok: false; error: string };

export async function decideMembership(
  membershipId: string,
  decision: "accepted" | "refused",
): Promise<DecideResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Action non autorisée." };
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) {
    return { ok: false, error: "Aucune résidence liée à ce compte." };
  }

  const membership = await prisma.residenceMembership.findFirst({
    where: {
      id: membershipId,
      residenceId,
      status: MembershipStatus.PENDING,
    },
  });

  if (!membership) {
    return { ok: false, error: "Demande introuvable ou déjà traitée." };
  }

  await prisma.residenceMembership.update({
    where: { id: membership.id },
    data: {
      status:
        decision === "accepted"
          ? MembershipStatus.ACTIVE
          : MembershipStatus.REFUSED,
      decidedAt: new Date(),
    },
  });

  revalidatePath("/gestionnaire");
  revalidatePath("/gestionnaire/inscriptions");
  revalidatePath("/en-attente");
  revalidatePath("/accueil");

  return { ok: true };
}

export type ResidenceMemberItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: string;
  fieldOfStudy: string;
  status: "active" | "left";
  joinedAt: string;
  leftAt?: string;
  leaveReason?: string;
};

export async function listResidenceMembers(): Promise<ResidenceMemberItem[]> {
  const session = await getSession();
  if (!session) return [];
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return [];
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) return [];

  const rows = await prisma.residenceMembership.findMany({
    where: {
      residenceId,
      status: { in: [MembershipStatus.ACTIVE, MembershipStatus.LEFT] },
    },
    include: { user: true },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    email: row.user.email,
    roomNumber: row.user.roomNumber ?? "—",
    fieldOfStudy: row.user.fieldOfStudy ?? "—",
    status: row.status === MembershipStatus.ACTIVE ? "active" : "left",
    joinedAt: formatDate(row.decidedAt ?? row.createdAt),
    leftAt: row.leftAt ? formatDate(row.leftAt) : undefined,
    leaveReason: row.leaveReason ?? undefined,
  }));
}

export async function removeResident(
  membershipId: string,
  leaveReason: string,
): Promise<DecideResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Action non autorisée." };
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) {
    return { ok: false, error: "Aucune résidence liée à ce compte." };
  }

  const reason = leaveReason.trim();
  if (!reason) {
    return { ok: false, error: "Indique un motif de départ." };
  }

  const membership = await prisma.residenceMembership.findFirst({
    where: {
      id: membershipId,
      residenceId,
      status: MembershipStatus.ACTIVE,
    },
  });

  if (!membership) {
    return { ok: false, error: "Résident introuvable ou déjà retiré." };
  }

  await prisma.residenceMembership.update({
    where: { id: membership.id },
    data: {
      status: MembershipStatus.LEFT,
      leaveReason: reason,
      leftAt: new Date(),
    },
  });

  revalidatePath("/gestionnaire");
  revalidatePath("/gestionnaire/residents");
  revalidatePath("/accueil");
  revalidatePath("/residents");

  return { ok: true };
}
