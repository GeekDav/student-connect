"use server";

import {
  getActiveStudentContext,
  writeBlockedResult,
} from "@/lib/student-context";
import {
  MarketplaceStatus,
  MarketplaceType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  MARKET_MAX_ACTIVE,
  MARKET_PROLONG_DAYS,
  MARKET_RETENTION_DAYS,
  MARKET_TTL_DAYS,
  addDays,
  daysAgo,
  formatUntilLabel,
} from "@/lib/board-ttl";

export type MarketItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: string;
  timeLabel: string;
  expiresLabel: string;
  type: "don" | "vente";
  priceLabel?: string;
  location: string;
  status: "available" | "reserved" | "gone" | "expired";
  interests: number;
  iInterested: boolean;
  isMine: boolean;
  canProlong: boolean;
};

export type MarketActionResult =
  | { ok: true; item?: MarketItem }
  | { ok: false; error: string };

const ACTIVE_STATUSES: MarketplaceStatus[] = [
  MarketplaceStatus.AVAILABLE,
  MarketplaceStatus.RESERVED,
];

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

function mapType(type: MarketplaceType): MarketItem["type"] {
  return type === MarketplaceType.DON ? "don" : "vente";
}

function mapStatus(status: MarketplaceStatus): MarketItem["status"] {
  switch (status) {
    case MarketplaceStatus.AVAILABLE:
      return "available";
    case MarketplaceStatus.RESERVED:
      return "reserved";
    case MarketplaceStatus.GONE:
      return "gone";
    case MarketplaceStatus.EXPIRED:
      return "expired";
  }
}

function mapItem(
  row: {
    id: string;
    title: string;
    description: string;
    type: MarketplaceType;
    priceLabel: string | null;
    location: string;
    status: MarketplaceStatus;
    createdAt: Date;
    expiresAt: Date;
    prolongedOnce: boolean;
    authorId: string;
    author: { firstName: string; lastName: string };
    interests: { userId: string }[];
  },
  userId: string,
): MarketItem {
  const isMine = row.authorId === userId;
  const active = ACTIVE_STATUSES.includes(row.status);
  const canReviveExpired = row.status === MarketplaceStatus.EXPIRED;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    author: `${row.author.firstName} ${row.author.lastName.charAt(0)}.`,
    authorId: row.authorId,
    timeLabel: formatRelative(row.createdAt),
    expiresLabel: formatUntilLabel(row.expiresAt),
    type: mapType(row.type),
    priceLabel: row.priceLabel ?? undefined,
    location: row.location,
    status: mapStatus(row.status),
    interests: row.interests.length,
    iInterested: row.interests.some((i) => i.userId === userId),
    isMine,
    canProlong:
      isMine &&
      !row.prolongedOnce &&
      (active || canReviveExpired),
  };
}

const marketInclude = {
  author: { select: { firstName: true, lastName: true } },
  interests: { select: { userId: true } },
} as const;

async function expireDueMarket(residenceId: string) {
  await prisma.marketplaceItem.updateMany({
    where: {
      residenceId,
      status: { in: ACTIVE_STATUSES },
      expiresAt: { lt: new Date() },
    },
    data: { status: MarketplaceStatus.EXPIRED },
  });
}

/** Pas un fil social : les terminés ne restent pas indéfiniment en base. */
async function purgeStaleMarket(residenceId: string) {
  await prisma.marketplaceItem.deleteMany({
    where: {
      residenceId,
      status: { in: [MarketplaceStatus.GONE, MarketplaceStatus.EXPIRED] },
      updatedAt: { lt: daysAgo(MARKET_RETENTION_DAYS) },
    },
  });
}

async function housekeepingMarket(residenceId: string) {
  await expireDueMarket(residenceId);
  await purgeStaleMarket(residenceId);
}

export async function listResidenceMarket(): Promise<MarketItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  await housekeepingMarket(ctx.residenceId);

  const rows = await prisma.marketplaceItem.findMany({
    where: { residenceId: ctx.residenceId },
    include: marketInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((row) => mapItem(row, ctx.session.userId));
}

export async function createMarketItem(input: {
  title: string;
  description: string;
  type: "don" | "vente";
  priceLabel: string;
  location: string;
}): Promise<MarketActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  const priceLabel = input.priceLabel.trim();

  if (!title) return { ok: false, error: "Donne un titre à l’annonce." };
  if (!description) {
    return { ok: false, error: "Ajoute une courte description." };
  }
  if (!location) {
    return { ok: false, error: "Indique où récupérer l’objet." };
  }
  if (input.type === "vente" && !priceLabel) {
    return { ok: false, error: "Indique un prix (ex. 10 €)." };
  }

  await housekeepingMarket(ctx.residenceId);

  const activeCount = await prisma.marketplaceItem.count({
    where: {
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
      status: { in: ACTIVE_STATUSES },
      expiresAt: { gt: new Date() },
    },
  });
  if (activeCount >= MARKET_MAX_ACTIVE) {
    return {
      ok: false,
      error: `Tu as déjà ${MARKET_MAX_ACTIVE} annonces actives. Marque-en une comme partie ou attends qu’elle expire.`,
    };
  }

  const row = await prisma.marketplaceItem.create({
    data: {
      title,
      description,
      type: input.type === "don" ? MarketplaceType.DON : MarketplaceType.VENTE,
      priceLabel: input.type === "vente" ? priceLabel : null,
      location,
      status: MarketplaceStatus.AVAILABLE,
      expiresAt: addDays(new Date(), MARKET_TTL_DAYS),
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
    include: marketInclude,
  });

  revalidatePath("/recyclerie");
  revalidatePath("/accueil");

  return { ok: true, item: mapItem(row, ctx.session.userId) };
}

export async function toggleMarketInterest(
  itemId: string,
): Promise<MarketActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  await housekeepingMarket(ctx.residenceId);

  const item = await prisma.marketplaceItem.findFirst({
    where: { id: itemId, residenceId: ctx.residenceId },
    include: marketInclude,
  });

  if (!item) return { ok: false, error: "Annonce introuvable." };
  if (item.status === MarketplaceStatus.GONE) {
    return { ok: false, error: "Cet objet est déjà parti." };
  }
  if (item.status === MarketplaceStatus.EXPIRED) {
    return { ok: false, error: "Cette annonce a expiré." };
  }
  if (item.authorId === ctx.session.userId) {
    return { ok: false, error: "Tu ne peux pas marquer d’intérêt sur ton annonce." };
  }

  const already = item.interests.some((i) => i.userId === ctx.session.userId);

  if (already) {
    await prisma.marketplaceInterest.delete({
      where: {
        itemId_userId: { itemId: item.id, userId: ctx.session.userId },
      },
    });
  } else {
    await prisma.marketplaceInterest.create({
      data: { itemId: item.id, userId: ctx.session.userId },
    });
  }

  const interestsCount = await prisma.marketplaceInterest.count({
    where: { itemId: item.id },
  });
  const nextStatus =
    interestsCount > 0
      ? MarketplaceStatus.RESERVED
      : MarketplaceStatus.AVAILABLE;

  await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: { status: nextStatus },
  });

  const refreshed = await prisma.marketplaceItem.findUniqueOrThrow({
    where: { id: item.id },
    include: marketInclude,
  });

  revalidatePath("/recyclerie");
  revalidatePath("/accueil");

  return { ok: true, item: mapItem(refreshed, ctx.session.userId) };
}

export async function markMarketGone(itemId: string): Promise<MarketActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  const item = await prisma.marketplaceItem.findFirst({
    where: {
      id: itemId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });

  if (!item) {
    return {
      ok: false,
      error: "Annonce introuvable ou tu n’en es pas l’auteur.",
    };
  }
  if (item.status === MarketplaceStatus.GONE) {
    return { ok: false, error: "Cette annonce est déjà marquée comme partie." };
  }

  await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: { status: MarketplaceStatus.GONE },
  });

  const refreshed = await prisma.marketplaceItem.findUniqueOrThrow({
    where: { id: item.id },
    include: marketInclude,
  });

  revalidatePath("/recyclerie");
  revalidatePath("/accueil");

  return { ok: true, item: mapItem(refreshed, ctx.session.userId) };
}

export async function prolongMarketItem(
  itemId: string,
): Promise<MarketActionResult> {
  const ctx = await getActiveStudentContext();
  if (!ctx) {
    return { ok: false, error: "Tu dois être un résident validé." };
  }
  if (!ctx.writable) return writeBlockedResult(ctx);

  await housekeepingMarket(ctx.residenceId);

  const item = await prisma.marketplaceItem.findFirst({
    where: {
      id: itemId,
      residenceId: ctx.residenceId,
      authorId: ctx.session.userId,
    },
  });

  if (!item) {
    return {
      ok: false,
      error: "Annonce introuvable ou tu n’en es pas l’auteur.",
    };
  }
  if (item.prolongedOnce) {
    return { ok: false, error: "Tu as déjà prolongé cette annonce une fois." };
  }
  if (item.status === MarketplaceStatus.GONE) {
    return { ok: false, error: "Cette annonce est déjà partie." };
  }
  if (
    item.status !== MarketplaceStatus.AVAILABLE &&
    item.status !== MarketplaceStatus.RESERVED &&
    item.status !== MarketplaceStatus.EXPIRED
  ) {
    return { ok: false, error: "Cette annonce ne peut plus être prolongée." };
  }

  if (item.status === MarketplaceStatus.EXPIRED) {
    const activeCount = await prisma.marketplaceItem.count({
      where: {
        residenceId: ctx.residenceId,
        authorId: ctx.session.userId,
        status: { in: ACTIVE_STATUSES },
        expiresAt: { gt: new Date() },
        NOT: { id: item.id },
      },
    });
    if (activeCount >= MARKET_MAX_ACTIVE) {
      return {
        ok: false,
        error: `Tu as déjà ${MARKET_MAX_ACTIVE} annonces actives. Marque-en une comme partie avant de prolonger celle-ci.`,
      };
    }
  }

  const base =
    item.status === MarketplaceStatus.EXPIRED ||
    item.expiresAt.getTime() < Date.now()
      ? new Date()
      : item.expiresAt;

  const refreshed = await prisma.marketplaceItem.update({
    where: { id: item.id },
    data: {
      expiresAt: addDays(base, MARKET_PROLONG_DAYS),
      prolongedOnce: true,
      status:
        item.status === MarketplaceStatus.EXPIRED
          ? MarketplaceStatus.AVAILABLE
          : item.status,
    },
    include: marketInclude,
  });

  revalidatePath("/recyclerie");
  revalidatePath("/accueil");

  return { ok: true, item: mapItem(refreshed, ctx.session.userId) };
}
