"use server";

import { MembershipStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type DirectoryResident = {
  id: string;
  firstName: string;
  lastName: string;
  school: string;
  fieldOfStudy: string;
  interests: string[];
  nationality?: string;
  bio?: string;
  avatarUrl?: string;
  isMine: boolean;
  isAvailable: boolean;
};

function parseInterests(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export async function listResidenceDirectory(): Promise<DirectoryResident[]> {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) return [];

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) return [];

  const rows = await prisma.residenceMembership.findMany({
    where: {
      residenceId: membership.residenceId,
      status: MembershipStatus.ACTIVE,
      user: { role: Role.STUDENT },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          school: true,
          fieldOfStudy: true,
          interests: true,
          nationality: true,
          showNationality: true,
          bio: true,
          avatarUrl: true,
          availableUntil: true,
        },
      },
    },
    orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
  });

  const now = Date.now();

  return rows.map((row) => ({
    id: row.user.id,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    school: row.user.school?.trim() || "—",
    fieldOfStudy: row.user.fieldOfStudy?.trim() || "—",
    interests: parseInterests(row.user.interests),
    nationality:
      row.user.showNationality && row.user.nationality?.trim()
        ? row.user.nationality.trim()
        : undefined,
    bio: row.user.bio?.trim() || undefined,
    avatarUrl: row.user.avatarUrl ?? undefined,
    isMine: row.user.id === session.userId,
    isAvailable: Boolean(
      row.user.availableUntil && row.user.availableUntil.getTime() > now,
    ),
  }));
}
