import type { ReactNode } from "react";
import { MembershipStatus, ResidenceStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { ResidencePauseBanner } from "@/components/ui/residence-pause-banner";
import { getUnreadMessageCount } from "@/lib/actions/messages";
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
      role: true,
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

  const isStaff =
    user.role === Role.MANAGER || user.role === Role.SUPER_ADMIN;

  let residenceName = "Ta résidence";
  let isPaused = false;
  let initialUnread = 0;

  if (isStaff) {
    const residence = await prisma.residence.findFirst({
      where:
        user.role === Role.SUPER_ADMIN
          ? undefined
          : { managerId: session.userId },
      select: { name: true, status: true },
      orderBy: { createdAt: "asc" },
    });
    residenceName = residence?.name ?? "Résidence";
    isPaused = residence?.status === ResidenceStatus.PAUSED;
  } else {
    const membership = user.memberships[0];
    residenceName = membership?.residence.name ?? "Ta résidence";
    isPaused = membership?.residence.status === ResidenceStatus.PAUSED;
    initialUnread = await getUnreadMessageCount();
  }

  return (
    <AppShell
      residenceName={residenceName}
      firstName={user.firstName}
      lastName={user.lastName}
      avatarUrl={user.avatarUrl}
      managerView={isStaff}
      initialUnread={initialUnread}
    >
      {isPaused ? (
        <ResidencePauseBanner
          variant={isStaff ? "manager" : "student"}
          planType={undefined}
        />
      ) : null}
      {children}
    </AppShell>
  );
}
