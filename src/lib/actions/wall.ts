"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type WallNoteItem = {
  id: string;
  body: string;
  author: string;
  authorId: string;
  isMine: boolean;
  timeLabel: string;
};

export type WallActionResult =
  | { ok: true; item?: WallNoteItem }
  | { ok: false; error: string };

const MAX_LEN = 280;

async function getActiveStudentContext() {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) return null;

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) return null;

  return { session, residenceId: membership.residenceId };
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
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

function mapNote(
  row: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { firstName: string; lastName: string };
  },
  userId: string,
): WallNoteItem {
  return {
    id: row.id,
    body: row.body,
    author: `${row.author.firstName} ${row.author.lastName.charAt(0)}.`,
    authorId: row.authorId,
    isMine: row.authorId === userId,
    timeLabel: formatRelative(row.createdAt),
  };
}

export async function listWallNotes(): Promise<WallNoteItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  const rows = await prisma.wallNote.findMany({
    where: { residenceId: ctx.residenceId },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return rows.map((row) => mapNote(row, ctx.session.userId));
}

export async function createWallNote(body: string): Promise<WallActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const text = body.trim();
  if (!text) return { ok: false, error: "Écris un petit mot." };
  if (text.length > MAX_LEN) {
    return { ok: false, error: `Max ${MAX_LEN} caractères.` };
  }

  const alreadyToday = await prisma.wallNote.findFirst({
    where: {
      authorId: ctx.session.userId,
      residenceId: ctx.residenceId,
      createdAt: { gte: startOfToday() },
    },
    select: { id: true },
  });
  if (alreadyToday) {
    return {
      ok: false,
      error: "Tu as déjà publié un petit mot aujourd’hui. Reviens demain.",
    };
  }

  const row = await prisma.wallNote.create({
    data: {
      body: text,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
    },
  });

  revalidatePath("/accueil");

  return { ok: true, item: mapNote(row, ctx.session.userId) };
}

export async function deleteWallNote(noteId: string): Promise<WallActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const note = await prisma.wallNote.findFirst({
    where: {
      id: noteId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });
  if (!note) {
    return { ok: false, error: "Note introuvable." };
  }

  await prisma.wallNote.delete({ where: { id: note.id } });
  revalidatePath("/accueil");
  return { ok: true };
}
