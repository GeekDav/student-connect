import type { ReactNode } from "react";
import { MembershipStatus, ResidenceStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { ResidencePauseBanner } from "@/components/ui/residence-pause-banner";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function StudentAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: {
          residence: { select: { name: true, status: true } },
        },
        take: 1,
      },
    },
  });

  if (!user) redirect("/connexion");

  const membership = user.memberships[0];
  const residenceName = membership?.residence.name ?? "Ta résidence";
  const isPaused = membership?.residence.status === ResidenceStatus.PAUSED;

  return (
    <AppShell
      residenceName={residenceName}
      firstName={user.firstName}
      lastName={user.lastName}
      avatarUrl={user.avatarUrl}
    >
      {isPaused ? <ResidencePauseBanner variant="student" /> : null}
      {children}
    </AppShell>
  );
}
