"use server";

import { randomBytes } from "crypto";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeInviteInput } from "@/lib/invite-utils";

export type InvitationItem = {
  id: string;
  code: string;
  label: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  revoked: boolean;
  active: boolean;
  createdAt: string;
  invitePath: string;
};

export type InvitationActionResult =
  | { ok: true; item?: InvitationItem }
  | { ok: false; error: string };

export type ResolvedInvite = {
  code: string;
  residenceId: string;
  residenceName: string;
  city: string;
};

async function getManagerResidence() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return null;
  }

  const residence = await prisma.residence.findFirst({
    where:
      session.role === Role.SUPER_ADMIN
        ? { status: "ACTIVE" }
        : { managerId: session.userId },
    orderBy: { createdAt: "asc" },
  });
  if (!residence) return null;

  return { session, residence };
}

function generateCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

function isInviteActive(row: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
}) {
  if (row.revokedAt) return false;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return false;
  if (row.maxUses != null && row.usedCount >= row.maxUses) return false;
  return true;
}

function mapInvite(row: {
  id: string;
  code: string;
  label: string | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}): InvitationItem {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    maxUses: row.maxUses,
    usedCount: row.usedCount,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    revoked: Boolean(row.revokedAt),
    active: isInviteActive(row),
    createdAt: row.createdAt.toISOString(),
    invitePath: `/inscription?invite=${row.code}`,
  };
}

/** Résout un code d’invitation public (inscription). */
export async function resolveInviteCode(
  code: string,
): Promise<ResolvedInvite | null> {
  const cleaned = normalizeInviteInput(code);
  if (!cleaned) return null;

  const row = await prisma.residenceInvitation.findUnique({
    where: { code: cleaned },
    include: {
      residence: {
        select: { id: true, name: true, city: true, status: true },
      },
    },
  });

  if (!row || row.residence.status !== "ACTIVE") return null;
  if (!isInviteActive(row)) return null;

  return {
    code: row.code,
    residenceId: row.residence.id,
    residenceName: row.residence.name,
    city: row.residence.city,
  };
}

export async function listResidenceInvitations(): Promise<InvitationItem[]> {
  const ctx = await getManagerResidence();
  if (!ctx) return [];

  const rows = await prisma.residenceInvitation.findMany({
    where: { residenceId: ctx.residence.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map(mapInvite);
}

export async function createResidenceInvitation(input: {
  label?: string;
  maxUses?: number | null;
  expiresInDays?: number | null;
}): Promise<InvitationActionResult> {
  const ctx = await getManagerResidence();
  if (!ctx) {
    return { ok: false, error: "Action non autorisée." };
  }
  if (ctx.residence.status !== "ACTIVE") {
    return {
      ok: false,
      error:
        "Résidence en pause : tu ne peux pas créer d’invitations tant que l’espace n’est pas réactivé.",
    };
  }

  const label = input.label?.trim() || null;
  const maxUses =
    input.maxUses == null || Number.isNaN(input.maxUses)
      ? null
      : Math.max(1, Math.min(500, Math.floor(input.maxUses)));
  const days =
    input.expiresInDays == null || Number.isNaN(input.expiresInDays)
      ? 30
      : Math.max(1, Math.min(365, Math.floor(input.expiresInDays)));

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  let code = generateCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.residenceInvitation.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!clash) break;
    code = generateCode();
  }

  const row = await prisma.residenceInvitation.create({
    data: {
      code,
      label,
      maxUses,
      expiresAt,
      residenceId: ctx.residence.id,
      createdById: ctx.session.userId,
    },
  });

  revalidatePath("/gestionnaire/invitations");
  revalidatePath("/gestionnaire");

  return { ok: true, item: mapInvite(row) };
}

export async function revokeResidenceInvitation(
  invitationId: string,
): Promise<InvitationActionResult> {
  const ctx = await getManagerResidence();
  if (!ctx) {
    return { ok: false, error: "Action non autorisée." };
  }

  const row = await prisma.residenceInvitation.findFirst({
    where: { id: invitationId, residenceId: ctx.residence.id },
  });
  if (!row) {
    return { ok: false, error: "Invitation introuvable." };
  }
  if (row.revokedAt) {
    return { ok: true, item: mapInvite(row) };
  }

  const updated = await prisma.residenceInvitation.update({
    where: { id: row.id },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/gestionnaire/invitations");
  return { ok: true, item: mapInvite(updated) };
}
