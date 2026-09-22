import { MembershipStatus, ResidenceStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const RESIDENCE_PAUSE_STUDENT_MESSAGE =
  "L’espace de ta résidence est en pause (abonnement). Tu peux encore consulter, mais pas publier ni envoyer de messages pour le moment.";

export const RESIDENCE_PAUSE_MANAGER_MESSAGE =
  "Cette résidence est en pause. Les étudiants sont en lecture seule. Réactive l’abonnement (ou contacte le support) pour rouvrir l’espace.";

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
  writable: boolean;
};

export async function getActiveStudentContext(): Promise<StudentResidenceContext | null> {
  const session = await getSession();
  if (!session || session.role !== Role.STUDENT) return null;

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
    include: {
      residence: {
        select: {
          id: true,
          name: true,
          status: true,
          planType: true,
          pausedAt: true,
          retainUntil: true,
        },
      },
    },
  });
  if (!membership) return null;

  return {
    session,
    residenceId: membership.residenceId,
    residence: membership.residence,
    writable: isResidenceWritable(membership.residence.status),
  };
}

export function writeBlockedResult() {
  return { ok: false as const, error: RESIDENCE_PAUSE_STUDENT_MESSAGE };
}
