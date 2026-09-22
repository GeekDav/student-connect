import type { ReactNode } from "react";
import { ResidenceStatus, Role } from "@prisma/client";
import { ManagerShell } from "@/components/manager/manager-shell";
import { ResidencePauseBanner } from "@/components/ui/residence-pause-banner";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function GestionnaireLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  const residence =
    session?.role === Role.SUPER_ADMIN
      ? await prisma.residence.findFirst({
          orderBy: { createdAt: "asc" },
        })
      : session
        ? await prisma.residence.findFirst({
            where: { managerId: session.userId },
          })
        : null;

  const isPaused = residence?.status === ResidenceStatus.PAUSED;

  return (
    <ManagerShell residenceName={residence?.name ?? "Résidence non assignée"}>
      {isPaused ? (
        <ResidencePauseBanner
          variant="manager"
          planType={residence?.planType}
        />
      ) : null}
      {children}
    </ManagerShell>
  );
}
