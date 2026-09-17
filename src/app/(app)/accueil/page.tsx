import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MembershipStatus } from "@prisma/client";
import { AccueilFeed } from "@/components/app/accueil-feed";
import { listStudentAnnouncements } from "@/lib/actions/announcements";
import { listResidenceEvents } from "@/lib/actions/events";
import { listResidenceMarket } from "@/lib/actions/marketplace";
import { listResidenceSos } from "@/lib/actions/sos";
import { listWallNotes } from "@/lib/actions/wall";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Accueil — Student-Connect",
  description: "L’actualité de ta résidence sur Student-Connect.",
};

export default async function AccueilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId, status: MembershipStatus.ACTIVE },
  });
  if (!membership) redirect("/en-attente");

  const [announcements, events, sosItems, marketItems, wallNotes] =
    await Promise.all([
      listStudentAnnouncements(),
      listResidenceEvents(),
      listResidenceSos(),
      listResidenceMarket(),
      listWallNotes(),
    ]);

  return (
    <AccueilFeed
      firstName={session.firstName}
      announcements={announcements}
      events={events}
      sosItems={sosItems}
      marketItems={marketItems}
      wallNotes={wallNotes}
    />
  );
}
