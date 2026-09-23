import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getActiveStudentContext } from "@/lib/student-context";
import { getSession } from "@/lib/auth";

/**
 * Accès aux pages étudiants.
 * Les gestionnaires / super-admins de la résidence peuvent consulter (lecture seule).
 */
export async function requireActiveStudent() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  if (
    session.role !== Role.STUDENT &&
    session.role !== Role.MANAGER &&
    session.role !== Role.SUPER_ADMIN
  ) {
    redirect("/");
  }

  const ctx = await getActiveStudentContext();
  if (!ctx) {
    if (session.role === Role.STUDENT) redirect("/en-attente");
    redirect("/gestionnaire");
  }

  return ctx;
}
