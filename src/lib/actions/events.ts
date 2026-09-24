"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  getActiveStudentContext,
  writeBlockedResult,
} from "@/lib/student-context";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  isMine: boolean;
  /** Libellé FR élégant dérivé de startsAt/endsAt. */
  whenLabel: string;
  startsAt: string;
  endsAt: string;
  where: string;
  spotsTotal: number;
  spotsTaken: number;
  joined: boolean;
};

export type EventActionResult =
  | { ok: true; item?: EventItem }
  | { ok: false; error: string };

function formatEventWhen(startsAt: Date, endsAt: Date): string {
  const sameDay =
    startsAt.getFullYear() === endsAt.getFullYear() &&
    startsAt.getMonth() === endsAt.getMonth() &&
    startsAt.getDate() === endsAt.getDate();

  const datePart = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(startsAt);

  const timeStart = compactTime(
    new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(startsAt),
  );

  // Début ≈ fin → affiche juste l’heure (ex. « sam. 12 oct. · 13h25 »)
  if (endsAt.getTime() - startsAt.getTime() < 2 * 60 * 1000) {
    return `${datePart} · ${timeStart}`;
  }

  const timeEnd = compactTime(
    new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(endsAt),
  );

  if (sameDay) {
    return `${datePart} · ${timeStart} – ${timeEnd}`;
  }

  const dateEnd = new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(endsAt);

  return `${datePart} ${timeStart} → ${dateEnd} ${timeEnd}`;
}

function compactTime(frTime: string) {
  // "20:00" → "20h" ; "20:30" → "20h30"
  const m = frTime.match(/(\d{1,2})[h:](\d{2})/);
  if (!m) return frTime.replace(":", "h");
  const h = m[1];
  const min = m[2];
  return min === "00" ? `${h}h` : `${h}h${min}`;
}

function mapEvent(
  row: {
    id: string;
    title: string;
    description: string;
    startsAt: Date;
    endsAt: Date;
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
    whenLabel: formatEventWhen(row.startsAt, row.endsAt),
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt.toISOString(),
    where: row.location,
    spotsTotal: row.spotsTotal,
    spotsTaken: row.participants.length,
    joined: row.participants.some((p) => p.userId === userId),
  };
}

const eventInclude = {
  author: { select: { firstName: true, lastName: true } },
  participants: { select: { userId: true } },
} as const;

/** Purge légère des events terminés (disparition auto). */
async function purgeExpiredEvents(residenceId: string) {
  await prisma.microEvent.deleteMany({
    where: {
      residenceId,
      endsAt: { lt: new Date() },
    },
  });
}

export async function listResidenceEvents(): Promise<EventItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  await purgeExpiredEvents(ctx.residenceId);

  const rows = await prisma.microEvent.findMany({
    where: {
      residenceId: ctx.residenceId,
      endsAt: { gt: new Date() },
    },
    include: eventInclude,
    orderBy: { startsAt: "asc" },
    take: 50,
  });

  return rows.map((row) => mapEvent(row, ctx.session.userId));
}

export async function createEvent(input: {
  title: string;
  description: string;
  /** ISO string ou datetime-local value. */
  startsAt: string;
  endsAt: string;
  where: string;
  spotsTotal: number;
}): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const title = input.title.trim();
  const description = input.description.trim();
  const where = input.where.trim();
  const spotsTotal = input.spotsTotal;

  if (!title) return { ok: false, error: "Donne un titre court." };
  if (!description) return { ok: false, error: "Ajoute une petite description." };
  if (!where) return { ok: false, error: "Indique où ça se passe." };
  if (!Number.isFinite(spotsTotal) || spotsTotal < 2 || spotsTotal > 30) {
    return { ok: false, error: "Entre 2 et 30 places." };
  }

  const startsAt = parseClientDateTime(input.startsAt);
  if (!startsAt) {
    return { ok: false, error: "Indique une date et une heure de début." };
  }

  const endsAt =
    parseClientDateTime(input.endsAt) ??
    new Date(startsAt.getTime() + 60_000);

  const now = Date.now();
  if (startsAt.getTime() < now - 60_000) {
    return { ok: false, error: "Choisis un horaire dans le futur." };
  }

  if (startsAt.getTime() > now + 90 * 24 * 60 * 60 * 1000) {
    return { ok: false, error: "Date trop lointaine (max 90 jours)." };
  }

  const sameDay =
    startsAt.getFullYear() === endsAt.getFullYear() &&
    startsAt.getMonth() === endsAt.getMonth() &&
    startsAt.getDate() === endsAt.getDate();

  if (!sameDay) {
    return {
      ok: false,
      error: "Un événement = une seule date (heures de début et fin le même jour).",
    };
  }

  if (endsAt.getTime() < startsAt.getTime()) {
    return { ok: false, error: "L’heure de fin doit être après le début." };
  }

  // Point horaire (pas de fin / fin = début) → disparaît juste après cette minute
  const resolvedEnd =
    endsAt.getTime() <= startsAt.getTime()
      ? new Date(startsAt.getTime() + 60_000)
      : endsAt;

  const row = await prisma.microEvent.create({
    data: {
      title,
      description,
      startsAt,
      endsAt: resolvedEnd,
      location: where,
      spotsTotal,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
      participants: {
        create: { userId: ctx.session.userId },
      },
    },
    include: eventInclude,
  });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true, item: mapEvent(row, ctx.session.userId) };
}

/** Accepte ISO ou valeur `datetime-local` (YYYY-MM-DDTHH:mm). */
function parseClientDateTime(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;
  // datetime-local sans timezone → traiter comme heure locale du serveur
  // (OK pour FR mono-fuseau ; le client envoie déjà l’heure locale).
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export async function toggleEventJoin(
  eventId: string,
): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const event = await prisma.microEvent.findFirst({
    where: {
      id: eventId,
      residenceId: ctx.residenceId,
      endsAt: { gt: new Date() },
    },
    include: eventInclude,
  });

  if (!event) {
    return { ok: false, error: "Événement introuvable ou déjà terminé." };
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
    include: eventInclude,
  });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true, item: mapEvent(refreshed, ctx.session.userId) };
}

/** L’auteur retire l’événement (complet, passé, ou annulé). */
export async function cancelEvent(eventId: string): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const event = await prisma.microEvent.findFirst({
    where: {
      id: eventId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });

  if (!event) {
    return { ok: false, error: "Événement introuvable ou non autorisé." };
  }

  await prisma.microEvent.delete({ where: { id: event.id } });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true };
}

/** L’auteur ajuste le nombre de places (ne peut pas descendre sous les inscrits). */
export async function updateEventSpots(
  eventId: string,
  spotsTotal: number,
): Promise<EventActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  if (!Number.isFinite(spotsTotal) || spotsTotal < 2 || spotsTotal > 30) {
    return { ok: false, error: "Entre 2 et 30 places." };
  }

  const event = await prisma.microEvent.findFirst({
    where: {
      id: eventId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
      endsAt: { gt: new Date() },
    },
    include: eventInclude,
  });

  if (!event) {
    return { ok: false, error: "Événement introuvable ou non autorisé." };
  }

  const taken = event.participants.length;
  if (spotsTotal < taken) {
    return {
      ok: false,
      error: `Tu as déjà ${taken} inscrit${taken > 1 ? "s" : ""}. Minimum ${taken} place${taken > 1 ? "s" : ""}.`,
    };
  }

  const updated = await prisma.microEvent.update({
    where: { id: event.id },
    data: { spotsTotal },
    include: eventInclude,
  });

  revalidatePath("/evenements");
  revalidatePath("/accueil");

  return { ok: true, item: mapEvent(updated, ctx.session.userId) };
}
