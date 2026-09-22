"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deletePublicUpload, saveAvatarFile } from "@/lib/uploads";

export type StudentProfileInput = {
  firstName: string;
  lastName: string;
  school: string;
  fieldOfStudy: string;
  interests: string;
  roomNumber: string;
  showNationality: boolean;
  nationality: string;
  bio: string;
};

export type ProfileActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(
  input: StudentProfileInput,
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.STUDENT) {
    return { ok: false, error: "Profil réservé aux étudiants." };
  }

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const school = input.school.trim();
  const fieldOfStudy = input.fieldOfStudy.trim();
  const interests = input.interests.trim();
  const roomNumber = input.roomNumber.trim();
  const bio = input.bio.trim();
  const showNationality = Boolean(input.showNationality);
  const nationality = input.nationality.trim();

  if (!firstName) return { ok: false, error: "Prénom requis." };
  if (!lastName) return { ok: false, error: "Nom requis." };
  if (!school) return { ok: false, error: "École / université requise." };
  if (!fieldOfStudy) return { ok: false, error: "Domaine d’études requis." };
  if (showNationality && !nationality) {
    return {
      ok: false,
      error: "Indique ta nationalité, ou décoche l’option.",
    };
  }
  if (bio.length > 500) {
    return { ok: false, error: "Bio trop longue (max 500 caractères)." };
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      firstName,
      lastName,
      school,
      fieldOfStudy,
      interests: interests || null,
      roomNumber: roomNumber || null,
      bio: bio || null,
      showNationality,
      nationality: showNationality ? nationality : null,
    },
  });

  if (firstName !== session.firstName || lastName !== session.lastName) {
    await setSessionCookie({
      userId: session.userId,
      email: session.email,
      role: session.role,
      firstName,
      lastName,
    });
  }

  revalidatePath("/profil");
  revalidatePath("/residents");
  revalidatePath("/accueil");
  revalidatePath("/messages");
  revalidatePath("/evenements");
  revalidatePath("/sos");
  revalidatePath("/recyclerie");

  return { ok: true };
}

export async function setAvailability(
  enabled: boolean,
): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.STUDENT) {
    return { ok: false, error: "Réservé aux étudiants." };
  }

  const availableUntil = enabled
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    : null;

  await prisma.user.update({
    where: { id: session.userId },
    data: { availableUntil },
  });

  revalidatePath("/profil");
  revalidatePath("/residents");

  return { ok: true };
}

export async function uploadAvatar(
  formData: FormData,
): Promise<ProfileActionResult & { avatarUrl?: string }> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.STUDENT) {
    return { ok: false, error: "Profil réservé aux étudiants." };
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choisis une photo." };
  }

  const saved = await saveAvatarFile(file);
  if (!saved.ok) return saved;

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: saved.url },
  });

  await deletePublicUpload(current?.avatarUrl);

  revalidatePath("/profil");
  revalidatePath("/residents");
  revalidatePath("/accueil");
  revalidatePath("/messages");

  return { ok: true, avatarUrl: saved.url };
}

export async function removeAvatar(): Promise<ProfileActionResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }
  if (session.role !== Role.STUDENT) {
    return { ok: false, error: "Profil réservé aux étudiants." };
  }

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { avatarUrl: true },
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: null },
  });

  await deletePublicUpload(current?.avatarUrl);

  revalidatePath("/profil");
  revalidatePath("/residents");
  revalidatePath("/accueil");
  revalidatePath("/messages");

  return { ok: true };
}
