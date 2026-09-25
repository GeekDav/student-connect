"use server";

import bcrypt from "bcryptjs";
import { MembershipStatus, ResidenceStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { pauseRetainUntil } from "@/lib/student-context";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail/mailer";
import {
  residenceActivatedEmail,
  residencePausedEmail,
  residenceReactivatedEmail,
} from "@/lib/mail/templates";

export type PlatformResidenceItem = {
  id: string;
  name: string;
  city: string;
  address: string;
  operator: string;
  managerName: string;
  managerEmail: string;
  createdAt: string;
  status: "active" | "paused";
  planType: "pilot" | "paid";
  pausedAt: string | null;
  retainUntil: string | null;
  pendingStudents: number;
  activeStudents: number;
};

export type SuperAdminActionResult =
  | { ok: true; residenceId?: string; managerEmail?: string }
  | { ok: false; error: string };

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.SUPER_ADMIN) return null;
  return session;
}

function formatCreatedAt(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseManagerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Gestionnaire" };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function listPlatformResidences(): Promise<
  PlatformResidenceItem[]
> {
  const session = await requireSuperAdmin();
  if (!session) return [];

  const rows = await prisma.residence.findMany({
    include: {
      manager: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withCounts = await Promise.all(
    rows.map(async (row) => {
      const [activeStudents, pendingStudents] = await Promise.all([
        prisma.residenceMembership.count({
          where: {
            residenceId: row.id,
            status: MembershipStatus.ACTIVE,
          },
        }),
        prisma.residenceMembership.count({
          where: {
            residenceId: row.id,
            status: MembershipStatus.PENDING,
          },
        }),
      ]);

      return {
        id: row.id,
        name: row.name,
        city: row.city,
        address: row.address,
        operator: row.operator,
        managerName: row.manager
          ? `${row.manager.firstName} ${row.manager.lastName}`
          : "Non assigné",
        managerEmail: row.manager?.email ?? "—",
        createdAt: formatCreatedAt(row.createdAt),
        status: row.status === ResidenceStatus.ACTIVE ? "active" : "paused",
        planType: row.planType === "PAID" ? "paid" : "pilot",
        pausedAt: row.pausedAt ? formatCreatedAt(row.pausedAt) : null,
        retainUntil: row.retainUntil ? formatCreatedAt(row.retainUntil) : null,
        pendingStudents,
        activeStudents,
      } satisfies PlatformResidenceItem;
    }),
  );

  return withCounts;
}

export async function createResidenceWithManager(input: {
  name: string;
  city: string;
  address: string;
  operator: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
}): Promise<SuperAdminActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "Accès réservé au super-admin." };
  }

  const name = input.name.trim();
  const city = input.city.trim();
  const address = input.address.trim();
  const operator = input.operator.trim();
  const managerEmail = input.managerEmail.trim().toLowerCase();
  const managerPassword = input.managerPassword;
  const { firstName, lastName } = parseManagerName(input.managerName);

  if (!name) return { ok: false, error: "Nom de la résidence requis." };
  if (!city) return { ok: false, error: "Ville requise." };
  if (!address) return { ok: false, error: "Adresse requise." };
  if (!operator) return { ok: false, error: "Gestionnaire / groupe requis." };
  if (!firstName) return { ok: false, error: "Nom du gestionnaire requis." };
  if (!managerEmail.includes("@")) {
    return { ok: false, error: "E-mail professionnel valide requis." };
  }
  if (managerPassword.length < 8) {
    return {
      ok: false,
      error: "Mot de passe temporaire : 8 caractères minimum.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: managerEmail },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "Cet e-mail est déjà utilisé. Choisis-en un autre.",
    };
  }

  const passwordHash = await bcrypt.hash(managerPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const manager = await tx.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        firstName,
        lastName,
        role: Role.MANAGER,
      },
    });

    const residence = await tx.residence.create({
      data: {
        name,
        city,
        address,
        operator,
        status: ResidenceStatus.ACTIVE,
        managerId: manager.id,
      },
    });

    return { residence, manager };
  });

  const activated = residenceActivatedEmail({
    managerName: result.manager.firstName,
    residenceName: result.residence.name,
    managerEmail: result.manager.email,
    temporaryPassword: managerPassword,
  });
  await sendEmail({
    to: result.manager.email,
    subject: activated.subject,
    html: activated.html,
    text: activated.text,
    template: activated.template,
    meta: { residenceId: result.residence.id },
  });

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/residences");
  revalidatePath("/super-admin/nouvelle-residence");
  revalidatePath("/super-admin/emails");
  revalidatePath("/inscription");

  return {
    ok: true,
    residenceId: result.residence.id,
    managerEmail: result.manager.email,
  };
}

export async function toggleResidenceStatus(
  residenceId: string,
): Promise<SuperAdminActionResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "Accès réservé au super-admin." };
  }

  const residence = await prisma.residence.findUnique({
    where: { id: residenceId },
    include: {
      manager: { select: { firstName: true, email: true } },
    },
  });
  if (!residence) {
    return { ok: false, error: "Résidence introuvable." };
  }

  const nextStatus =
    residence.status === ResidenceStatus.ACTIVE
      ? ResidenceStatus.PAUSED
      : ResidenceStatus.ACTIVE;

  const now = new Date();
  await prisma.residence.update({
    where: { id: residence.id },
    data:
      nextStatus === ResidenceStatus.PAUSED
        ? {
            status: nextStatus,
            pausedAt: now,
            retainUntil: pauseRetainUntil(now),
          }
        : {
            status: nextStatus,
            pausedAt: null,
            retainUntil: null,
            lastPauseReminderAt: null,
          },
  });

  if (residence.manager?.email) {
    if (nextStatus === ResidenceStatus.PAUSED) {
      const retainUntil = pauseRetainUntil(now);
      const tpl = residencePausedEmail({
        managerName: residence.manager.firstName,
        residenceName: residence.name,
        retainUntilLabel: retainUntil.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      });
      await sendEmail({
        to: residence.manager.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: tpl.template,
        meta: { residenceId: residence.id },
      });
    } else {
      const tpl = residenceReactivatedEmail({
        managerName: residence.manager.firstName,
        residenceName: residence.name,
      });
      await sendEmail({
        to: residence.manager.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: tpl.template,
        meta: { residenceId: residence.id },
      });
    }
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/residences");
  revalidatePath("/super-admin/en-pause");
  revalidatePath("/super-admin/emails");
  revalidatePath("/inscription");
  revalidatePath("/accueil");
  revalidatePath("/gestionnaire");

  return { ok: true, residenceId: residence.id };
}

export type UpdateManagerEmailResult =
  | { ok: true; managerEmail: string }
  | { ok: false; error: string };

/** Super-admin : change l’e-mail du gestionnaire d’une résidence. */
export async function updateManagerEmail(
  residenceId: string,
  newEmail: string,
): Promise<UpdateManagerEmailResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "Accès réservé au super-admin." };
  }

  const email = newEmail.trim().toLowerCase();
  if (!email || !email.includes("@") || email.length < 5) {
    return { ok: false, error: "Indique une adresse e-mail valide." };
  }

  const residence = await prisma.residence.findUnique({
    where: { id: residenceId },
    select: { id: true, managerId: true },
  });
  if (!residence?.managerId) {
    return { ok: false, error: "Aucun gestionnaire lié à cette résidence." };
  }

  const manager = await prisma.user.findUnique({
    where: { id: residence.managerId },
    select: { id: true, email: true, role: true },
  });
  if (!manager || manager.role !== Role.MANAGER) {
    return { ok: false, error: "Compte gestionnaire introuvable." };
  }

  if (email === manager.email) {
    return { ok: false, error: "C’est déjà l’e-mail actuel." };
  }

  const taken = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (taken) {
    return { ok: false, error: "Cet e-mail est déjà utilisé." };
  }

  await prisma.user.update({
    where: { id: manager.id },
    data: { email },
  });

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/residences");

  return { ok: true, managerEmail: email };
}

export type UpdateResidenceNameResult =
  | { ok: true; name: string }
  | { ok: false; error: string };

/** Super-admin : corrige le nom d’une résidence. */
export async function updateResidenceName(
  residenceId: string,
  newName: string,
): Promise<UpdateResidenceNameResult> {
  const session = await requireSuperAdmin();
  if (!session) {
    return { ok: false, error: "Accès réservé au super-admin." };
  }

  const name = newName.trim();
  if (name.length < 2) {
    return { ok: false, error: "Indique un nom de résidence valide." };
  }
  if (name.length > 120) {
    return { ok: false, error: "Nom trop long (max 120 caractères)." };
  }

  const residence = await prisma.residence.findUnique({
    where: { id: residenceId },
    select: { id: true, name: true },
  });
  if (!residence) {
    return { ok: false, error: "Résidence introuvable." };
  }

  if (name === residence.name) {
    return { ok: false, error: "C’est déjà le nom actuel." };
  }

  await prisma.residence.update({
    where: { id: residence.id },
    data: { name },
  });

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/residences");
  revalidatePath("/inscription");
  revalidatePath("/gestionnaire");

  return { ok: true, name };
}
