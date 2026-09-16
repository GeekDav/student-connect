import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function requireManagerContext() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    redirect("/");
  }

  const residence = await prisma.residence.findFirst({
    where:
      session.role === Role.SUPER_ADMIN
        ? { status: "ACTIVE" }
        : { managerId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  if (!residence) {
    throw new Error("NONE_RESIDENCE");
  }

  return { session, residence };
}
