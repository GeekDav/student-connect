"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  isMine: boolean;
  whenLabel: string;
  where: string;
  spotsTotal: number;
  spotsTaken: number;
  joined: boolean;
};

export type EventActionResult =
  | { ok: true; item?: EventItem }
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

function mapEvent(
  row: {
    id: string;
    title: string;
    description: string;
    whenLabel: string;
    location: string;
    spotsTotal: number;
    authorId: string;
    author: { firstName: string; lastName: string };
    participants: { userId: string }[];
  },
  userId: string,
): EventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: `${row.author.firstName} ${row.author.lastName.charAt(0)}.`,
    authorId: row.authorId,
    isMine: row.authorId === userId,
    whenLabel: row.whenLabel,
    where: row.location,
    spotsTotal: row.spotsTotal,
    spotsTaken: row.participants.length,
    joined: row.participants.some((p) => p.userId === userId),
  };
}

export async function listResidenceEvents(): Promise<EventItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  const rows = await prisma.microEvent.findMany({
    where: { residenceId: ctx.residenceId },
    include: {
      author: { select: { firstName: true, lastName: true } },
      participants: { select: { userId: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((row) => mapEvent(row, ctx.session.userId));
}

export async function createEvent(input: {
  title: string;
  description: string;
  whenLabel: string;
  where: string;
  spotsTotal: number;
}): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const title = input.title.trim();
  const description = input.description.trim();
  const whenLabel = input.whenLabel.trim();
  const where = input.where.trim();
  const spotsTotal = input.spotsTotal;

  if (!title) return { ok: false, error: "Donne un titre court." };
  if (!description) return { ok: false, error: "Ajoute une petite description." };
  if (!whenLabel) return { ok: false, error: "Indique quand." };
  if (!where) return { ok: false, error: "Indique où ça se passe." };
  if (!Number.isFinite(spotsTotal) || spotsTotal < 2 || spotsTotal > 30) {
    return { ok: false, error: "Entre 2 et 30 places." };
  }

  const row = await prisma.microEvent.create({
    data: {
      title,
      description,
      whenLabel,
      location: where,
      spotsTotal,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
      participants: {
        create: { userId: ctx.session.userId },
      },
    },
    include: {
      author: { select: { firstName: true, lastName: true } },
      participants: { select: { userId: true } },
    },
  });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true, item: mapEvent(row, ctx.session.userId) };
}

export async function toggleEventJoin(
  eventId: string,
): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }

  const event = await prisma.microEvent.findFirst({
    where: { id: eventId, residenceId: ctx.residenceId },
    include: {
      author: { select: { firstName: true, lastName: true } },
      participants: { select: { userId: true } },
    },
  });

  if (!event) {
    return { ok: false, error: "Événement introuvable." };
  }

  const alreadyJoined = event.participants.some(
    (p) => p.userId === ctx.session.userId,
  );

  if (alreadyJoined) {
    await prisma.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId: event.id,
          userId: ctx.session.userId,
        },
      },
    });
  } else {
    if (event.participants.length >= event.spotsTotal) {
      return { ok: false, error: "Plus de places disponibles." };
    }
    await prisma.eventParticipant.create({
      data: {
        eventId: event.id,
        userId: ctx.session.userId,
      },
    });
  }

  const refreshed = await prisma.microEvent.findUniqueOrThrow({
    where: { id: event.id },
    include: {
      author: { select: { firstName: true, lastName: true } },
      participants: { select: { userId: true } },
    },
  });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true, item: mapEvent(refreshed, ctx.session.userId) };
}
