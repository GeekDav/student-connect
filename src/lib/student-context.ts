import { MembershipStatus, ResidenceStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const RESIDENCE_PAUSE_STUDENT_MESSAGE =
  "L’espace de ta résidence est en pause. Tu peux encore consulter, mais pas publier ni envoyer de messages.";

export const RESIDENCE_PAUSE_MANAGER_MESSAGE =
  "Cette résidence est en pause. Les étudiants sont en lecture seule. Réactive l’abonnement (ou contacte le support) pour rouvrir l’espace.";

export const MANAGER_VIEW_ONLY_MESSAGE =
  "Consultation seule — les actions sont réservées aux résidents.";

/** Données conservées 12 mois après le passage en pause. */
export const PAUSE_RETAIN_MONTHS = 12;

export function isResidenceWritable(status: ResidenceStatus) {
  return status === ResidenceStatus.ACTIVE;
}

export function pauseRetainUntil(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + PAUSE_RETAIN_MONTHS);
  return d;
}

const residenceSelect = {
  id: true,
  name: true,
  status: true,
  planType: true,
  pausedAt: true,
  retainUntil: true,
} as const;

export type StudentResidenceContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  residenceId: string;
  residence: {
    id: string;
    name: string;
    status: ResidenceStatus;
    planType: "PILOT" | "PAID";
    pausedAt: Date | null;
    retainUntil: Date | null;
  };
  /** Peut publier / interagir (étudiant + résidence ACTIVE). */
  writable: boolean;
  /** true = résident actif ; false = gestionnaire / super-admin en consultation. */
  isResident: boolean;
};

async function findManagedResidence(userId: string, role: Role) {
  return prisma.residence.findFirst({
    where:
      role === Role.SUPER_ADMIN
        ? undefined
        : { managerId: userId },
    select: residenceSelect,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Contexte résidence pour les boards étudiants.
 * Inclut aussi les gestionnaires (lecture seule) pour le pouls dashboard.
 */
export async function getActiveStudentContext(): Promise<StudentResidenceContext | null> {
  const session = await getSession();
  if (!session) return null;

  if (session.role === Role.STUDENT) {
    const membership = await prisma.residenceMembership.findFirst({
      where: { userId: session.userId, status: MembershipStatus.ACTIVE },
      include: { residence: { select: residenceSelect } },
    });
    if (!membership) return null;

    return {
      session,
      residenceId: membership.residenceId,
      residence: membership.residence,
      writable: isResidenceWritable(membership.residence.status),
      isResident: true,
    };
  }

  if (session.role === Role.MANAGER || session.role === Role.SUPER_ADMIN) {
    const residence = await findManagedResidence(session.userId, session.role);
    if (!residence) return null;

    return {
      session,
      residenceId: residence.id,
      residence,
      writable: false,
      isResident: false,
    };
  }

  return null;
}

export function writeBlockedResult(ctx?: StudentResidenceContext | null) {
  if (ctx && !ctx.isResident) {
    return { ok: false as const, error: MANAGER_VIEW_ONLY_MESSAGE };
  }
  return { ok: false as const, error: RESIDENCE_PAUSE_STUDENT_MESSAGE };
}
