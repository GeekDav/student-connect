"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getActiveStudentContext } from "@/lib/student-context";
import { STUDENT_FEED_ANNOUNCEMENT_LIMIT } from "@/lib/announcement-limits";
import { deletePublicUpload, saveAnnouncementImage } from "@/lib/uploads";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  publishedAt: string;
  published: boolean;
  /** Lectures uniques (gestionnaire). */
  readCount?: number;
  /** Non lu par l’étudiant connecté. */
  unread?: boolean;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function mapAnnouncement(
  row: {
    id: string;
    title: string;
    body: string;
    imageUrl: string | null;
    createdAt: Date;
    published: boolean;
  },
  extras?: { readCount?: number; unread?: boolean },
): AnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.imageUrl ?? undefined,
    publishedAt: formatDate(row.createdAt),
    published: row.published,
    readCount: extras?.readCount,
    unread: extras?.unread,
  };
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

export async function listManagerAnnouncements(): Promise<AnnouncementItem[]> {
  const session = await getSession();
  if (!session) return [];
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return [];
  }

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) return [];

  const rows = await prisma.officialAnnouncement.findMany({
    where: { residenceId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { reads: true } } },
  });

  return rows.map((row) =>
    mapAnnouncement(row, { readCount: row._count.reads }),
  );
}

export async function getActiveResidentsCount(): Promise<number> {
  const session = await getSession();
  if (!session) return 0;
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return 0;
  }
  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) return 0;
  return prisma.residenceMembership.count({
    where: { residenceId, status: MembershipStatus.ACTIVE },
  });
}

export type AnnouncementActionResult =
  | { ok: true; item?: AnnouncementItem }
  | { ok: false; error: string };

export async function createAnnouncement(
  formData: FormData,
): Promise<AnnouncementActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Action non autorisée." };
  }

  const trimmedTitle = String(formData.get("title") ?? "").trim();
  const trimmedBody = String(formData.get("body") ?? "").trim();
  if (!trimmedTitle) return { ok: false, error: "Titre requis." };
  if (!trimmedBody) return { ok: false, error: "Contenu requis." };

  const residenceId = await getManagerResidenceId(session.userId, session.role);
  if (!residenceId) {
    return { ok: false, error: "Aucune résidence liée à ce compte." };
  }

  const image = formData.get("image");
  let imageUrl: string | null = null;
  if (image instanceof File && image.size > 0) {
    const saved = await saveAnnouncementImage(image);
    if (!saved.ok) return saved;
    imageUrl = saved.url;
  }

  try {
    const row = await prisma.officialAnnouncement.create({
      data: {
        title: trimmedTitle,
        body: trimmedBody,
        imageUrl,
        published: true,
        residenceId,
        authorId: session.userId,
      },
    });

    revalidatePath("/gestionnaire");
    revalidatePath("/gestionnaire/annonces");
    revalidatePath("/accueil");

    return { ok: true, item: mapAnnouncement(row, { readCount: 0 }) };
  } catch (error) {
    await deletePublicUpload(imageUrl);
    throw error;
  }
}

export async function unpublishAnnouncement(
  announcementId: string,
): Promise<AnnouncementActionResult> {
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

  const existing = await prisma.officialAnnouncement.findFirst({
    where: {
      id: announcementId,
      residenceId,
      published: true,
    },
  });

  if (!existing) {
    return { ok: false, error: "Annonce introuvable ou déjà retirée." };
  }

  await prisma.officialAnnouncement.update({
    where: { id: existing.id },
    data: {
      published: false,
      unpublishedAt: new Date(),
    },
  });

  revalidatePath("/gestionnaire");
  revalidatePath("/gestionnaire/annonces");
  revalidatePath("/accueil");

  return { ok: true };
}

export async function listStudentAnnouncements(): Promise<AnnouncementItem[]> {
  const ctx = await getActiveStudentContext();
  if (!ctx) return [];

  const rows = await prisma.officialAnnouncement.findMany({
    where: { residenceId: ctx.residenceId, published: true },
    orderBy: { createdAt: "desc" },
    take: STUDENT_FEED_ANNOUNCEMENT_LIMIT,
    include: {
      reads: {
        where: { userId: ctx.session.userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  return rows.map((row) =>
    mapAnnouncement(row, {
      unread: ctx.isResident ? row.reads.length === 0 : false,
    }),
  );
}

/** Marque des annonces comme lues (étudiant). */
export async function markAnnouncementsRead(
  announcementIds: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) {
    return { ok: false, error: "Action non autorisée." };
  }

  const ids = [...new Set(announcementIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return { ok: true };

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
    select: { residenceId: true },
  });
  if (!membership) return { ok: false, error: "Aucune résidence active." };

  const owned = await prisma.officialAnnouncement.findMany({
    where: {
      id: { in: ids },
      residenceId: membership.residenceId,
      published: true,
    },
    select: { id: true },
  });

  if (owned.length === 0) return { ok: true };

  await prisma.announcementRead.createMany({
    data: owned.map((row) => ({
      announcementId: row.id,
      userId: session.userId,
    })),
    skipDuplicates: true,
  });

  revalidatePath("/accueil");
  revalidatePath("/gestionnaire/annonces");

  return { ok: true };
}
