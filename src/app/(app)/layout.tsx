import type { ReactNode } from "react";
import { MembershipStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
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
        include: { residence: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (!user) redirect("/connexion");

  const residenceName =
    user.memberships[0]?.residence.name ?? "Ta résidence";

  return (
    <AppShell
      residenceName={residenceName}
      firstName={user.firstName}
      lastName={user.lastName}
      avatarUrl={user.avatarUrl}
    >
      {children}
    </AppShell>
  );
}
