"use server";

import bcrypt from "bcryptjs";
import { MembershipStatus, Role } from "@prisma/client";
import { z } from "zod";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";

const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  residenceId: z.string().min(1),
  school: z.string().trim().min(1),
  fieldOfStudy: z.string().trim().min(1),
  interests: z.string().trim().optional(),
  roomNumber: z.string().trim().min(1),
  showNationality: z.boolean(),
  nationality: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type AuthActionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export async function registerStudent(
  input: z.infer<typeof registerSchema>,
): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Vérifie les champs du formulaire." };
  }

  const data = parsed.data;
  if (data.showNationality && !data.nationality?.trim()) {
    return {
      ok: false,
      error: "Indique ta nationalité, ou décoche l’option.",
    };
  }

  const residence = await prisma.residence.findFirst({
    where: { id: data.residenceId, status: "ACTIVE" },
  });
  if (!residence) {
    return { ok: false, error: "Résidence partenaire introuvable." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: data.email.toLowerCase() },
  });
  if (existing) {
    return { ok: false, error: "Un compte existe déjà avec cet e-mail." };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: Role.STUDENT,
      school: data.school,
      fieldOfStudy: data.fieldOfStudy,
      interests: data.interests || null,
      roomNumber: data.roomNumber,
      showNationality: data.showNationality,
      nationality: data.showNationality ? data.nationality : null,
      memberships: {
        create: {
          residenceId: residence.id,
          status: MembershipStatus.PENDING,
        },
      },
    },
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  return { ok: true, redirectTo: "/en-attente" };
}

export async function loginUser(
  input: z.infer<typeof loginSchema>,
): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "E-mail ou mot de passe invalide." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  if (user.role === Role.SUPER_ADMIN) {
    return { ok: true, redirectTo: "/super-admin" };
  }
  if (user.role === Role.MANAGER) {
    return { ok: true, redirectTo: "/gestionnaire" };
  }

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!membership || membership.status === MembershipStatus.PENDING) {
    return { ok: true, redirectTo: "/en-attente" };
  }
  if (membership.status === MembershipStatus.REFUSED) {
    return {
      ok: false,
      error: "Ton inscription a été refusée. Contacte ta résidence.",
    };
  }
  if (membership.status === MembershipStatus.LEFT) {
    return {
      ok: false,
      error: "Tu n’es plus rattaché à une résidence active.",
    };
  }

  return { ok: true, redirectTo: "/accueil" };
}

export async function logoutUser(): Promise<AuthActionResult> {
  await clearSessionCookie();
  return { ok: true, redirectTo: "/" };
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ChangePasswordResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }

  const currentPassword = input.currentPassword;
  const newPassword = input.newPassword;
  const confirmPassword = input.confirmPassword;

  if (!currentPassword) {
    return { ok: false, error: "Indique ton mot de passe actuel." };
  }
  if (newPassword.length < 8) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit faire au moins 8 caractères.",
    };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: "La confirmation ne correspond pas." };
  }
  if (newPassword === currentPassword) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit être différent de l’actuel.",
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return { ok: false, error: "Compte introuvable." };
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true };
}

export async function listActiveResidences() {
  return prisma.residence.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      operator: true,
    },
  });
}
