import { MembershipStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireActiveStudent() {
  const session = await getSession();
  if (!session) redirect("/connexion");
  if (session.role !== Role.STUDENT) redirect("/");

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
    include: { residence: true },
  });

  if (!membership) redirect("/en-attente");

  return { session, membership, residence: membership.residence };
}
