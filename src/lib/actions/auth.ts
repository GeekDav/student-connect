"use server";

import bcrypt from "bcryptjs";
import { MembershipStatus, Role } from "@prisma/client";
import { z } from "zod";
import { clearSessionCookie, getSession, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveInviteCode } from "@/lib/actions/invitations";

const registerSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  residenceId: z.string().min(1),
  school: z.string().trim().min(1),
  fieldOfStudy: z.string().trim().min(1),
  interests: z.string().trim().optional(),
  showNationality: z.boolean(),
  nationality: z.string().trim().optional(),
  /** Code d’invitation → accès immédiat (ACTIVE). Sans code → PENDING. */
  inviteCode: z.string().trim().optional(),
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

  let membershipStatus: MembershipStatus = MembershipStatus.PENDING;
  let residenceId = data.residenceId;
  let inviteCode: string | null = null;

  if (data.inviteCode?.trim()) {
    const invite = await resolveInviteCode(data.inviteCode);
    if (!invite) {
      return {
        ok: false,
        error: "Invitation invalide ou expirée. Demande un nouveau lien.",
      };
    }
    residenceId = invite.residenceId;
    inviteCode = invite.code;
    membershipStatus = MembershipStatus.ACTIVE;
  }

  const residence = await prisma.residence.findFirst({
    where: { id: residenceId, status: "ACTIVE" },
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

  try {
    const user = await prisma.$transaction(async (tx) => {
      if (inviteCode) {
        const inviteRow = await tx.residenceInvitation.findUnique({
          where: { code: inviteCode },
        });
        if (
          !inviteRow ||
          inviteRow.residenceId !== residence.id ||
          inviteRow.revokedAt ||
          (inviteRow.expiresAt &&
            inviteRow.expiresAt.getTime() <= Date.now()) ||
          (inviteRow.maxUses != null &&
            inviteRow.usedCount >= inviteRow.maxUses)
        ) {
          throw new Error("INVITE_INVALID");
        }
        await tx.residenceInvitation.update({
          where: { id: inviteRow.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.user.create({
        data: {
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          role: Role.STUDENT,
          school: data.school,
          fieldOfStudy: data.fieldOfStudy,
          interests: data.interests || null,
          showNationality: data.showNationality,
          nationality: data.showNationality ? data.nationality : null,
          memberships: {
            create: {
              residenceId: residence.id,
              status: membershipStatus,
              decidedAt:
                membershipStatus === MembershipStatus.ACTIVE
                  ? new Date()
                  : null,
            },
          },
        },
      });
    });

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    return {
      ok: true,
      redirectTo:
        membershipStatus === MembershipStatus.ACTIVE
          ? "/accueil"
          : "/en-attente",
    };
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_INVALID") {
      return {
        ok: false,
        error: "Invitation invalide ou expirée. Demande un nouveau lien.",
      };
    }
    throw error;
  }
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

export type ChangeEmailResult =
  | { ok: true; email: string }
  | { ok: false; error: string };

/** Étudiant ou super-admin uniquement (pas le gestionnaire en self-service). */
export async function changeEmail(input: {
  newEmail: string;
  currentPassword: string;
}): Promise<ChangeEmailResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, error: "Session expirée. Reconnecte-toi." };
  }

  if (session.role === Role.MANAGER) {
    return {
      ok: false,
      error:
        "Le changement d’e-mail gestionnaire est géré par le super-admin de la plateforme.",
    };
  }

  const newEmail = input.newEmail.trim().toLowerCase();
  if (!newEmail || !newEmail.includes("@") || newEmail.length < 5) {
    return { ok: false, error: "Indique une adresse e-mail valide." };
  }
  if (!input.currentPassword) {
    return { ok: false, error: "Indique ton mot de passe actuel." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  });
  if (!user) {
    return { ok: false, error: "Compte introuvable." };
  }

  if (newEmail === user.email) {
    return { ok: false, error: "C’est déjà ton e-mail actuel." };
  }

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    return { ok: false, error: "Mot de passe actuel incorrect." };
  }

  const taken = await prisma.user.findUnique({
    where: { email: newEmail },
    select: { id: true },
  });
  if (taken) {
    return { ok: false, error: "Cet e-mail est déjà utilisé." };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  await setSessionCookie({
    userId: user.id,
    email: newEmail,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  });

  return { ok: true, email: newEmail };
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
