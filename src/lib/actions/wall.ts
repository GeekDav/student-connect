"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type WallReplyItem = {
  id: string;
  body: string;
  author: string;
  authorId: string;
  isMine: boolean;
  timeLabel: string;
};

export type WallNoteItem = {
  id: string;
  body: string;
  author: string;
  authorId: string;
  isMine: boolean;
  timeLabel: string;
  replies: WallReplyItem[];
};

export type WallActionResult =
  | { ok: true; item?: WallNoteItem; reply?: WallReplyItem }
  | { ok: false; error: string };

const MAX_NOTE_LEN = 280;
const MAX_REPLY_LEN = 160;
const MAX_REPLIES_PER_NOTE = 40;
/** Les notes du mur expirent après 7 jours (et leurs réponses avec). */
const NOTE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function noteExpiryCutoff() {
  return new Date(Date.now() - NOTE_TTL_MS);
}

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

function authorLabel(firstName: string, lastName: string) {
  return `${firstName} ${lastName.charAt(0)}.`;
}

function mapReply(
  row: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { firstName: string; lastName: string };
  },
  userId: string,
): WallReplyItem {
  return {
    id: row.id,
    body: row.body,
    author: authorLabel(row.author.firstName, row.author.lastName),
    authorId: row.authorId,
    isMine: row.authorId === userId,
    timeLabel: formatRelative(row.createdAt),
  };
}

function mapNote(
  row: {
    id: string;
    body: string;
    createdAt: Date;
    authorId: string;
    author: { firstName: string; lastName: string };
    replies?: Array<{
      id: string;
      body: string;
      createdAt: Date;
      authorId: string;
      author: { firstName: string; lastName: string };
    }>;
  },
  userId: string,
): WallNoteItem {
  return {
    id: row.id,
    body: row.body,
    author: authorLabel(row.author.firstName, row.author.lastName),
    authorId: row.authorId,
    isMine: row.authorId === userId,
    timeLabel: formatRelative(row.createdAt),
    replies: (row.replies ?? []).map((reply) => mapReply(reply, userId)),
  };
}

const replyInclude = {
  author: { select: { firstName: true, lastName: true } },
} as const;

export async function listWallNotes(): Promise<WallNoteItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  const cutoff = noteExpiryCutoff();

  // Nettoyage paresseux : retire les notes trop vieilles (réponses en cascade).
  await prisma.wallNote.deleteMany({
    where: {
      residenceId: ctx.residenceId,
      createdAt: { lt: cutoff },
    },
  });

  const rows = await prisma.wallNote.findMany({
    where: {
      residenceId: ctx.residenceId,
      createdAt: { gte: cutoff },
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
      replies: {
        include: replyInclude,
        orderBy: { createdAt: "asc" },
        take: MAX_REPLIES_PER_NOTE,
      },
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
  if (text.length > MAX_NOTE_LEN) {
    return { ok: false, error: `Max ${MAX_NOTE_LEN} caractères.` };
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
      replies: {
        include: replyInclude,
        orderBy: { createdAt: "asc" },
      },
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

export async function createWallReply(
  noteId: string,
  body: string,
): Promise<WallActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const text = body.trim();
  if (!text) return { ok: false, error: "Écris une réponse." };
  if (text.length > MAX_REPLY_LEN) {
    return { ok: false, error: `Max ${MAX_REPLY_LEN} caractères.` };
  }

  const note = await prisma.wallNote.findFirst({
    where: { id: noteId, residenceId: ctx.residenceId },
    select: { id: true, _count: { select: { replies: true } } },
  });
  if (!note) {
    return { ok: false, error: "Note introuvable." };
  }
  if (note._count.replies >= MAX_REPLIES_PER_NOTE) {
    return {
      ok: false,
      error: "Trop de réponses sur ce post — passe en message privé.",
    };
  }

  const reply = await prisma.wallNoteReply.create({
    data: {
      body: text,
      noteId: note.id,
      authorId: ctx.session.userId,
    },
    include: replyInclude,
  });

  revalidatePath("/accueil");
  return { ok: true, reply: mapReply(reply, ctx.session.userId) };
}

export async function deleteWallReply(
  replyId: string,
): Promise<WallActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const reply = await prisma.wallNoteReply.findFirst({
    where: {
      id: replyId,
      authorId: ctx.session.userId,
      note: { residenceId: ctx.residenceId },
    },
  });
  if (!reply) {
    return { ok: false, error: "Réponse introuvable." };
  }

  await prisma.wallNoteReply.delete({ where: { id: reply.id } });
  revalidatePath("/accueil");
  return { ok: true };
}
