import type { Metadata } from "next";
import { AccueilFeed } from "@/components/app/accueil-feed";
import { listStudentAnnouncements } from "@/lib/actions/announcements";
import { listResidenceEvents } from "@/lib/actions/events";
import { listResidenceMarket } from "@/lib/actions/marketplace";
import { listResidenceSos } from "@/lib/actions/sos";
import { listWallNotes } from "@/lib/actions/wall";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "Accueil — Student-Connect",
  description: "L’actualité de ta résidence sur Student-Connect.",
};

export default async function AccueilPage() {
  const ctx = await requireActiveStudent();

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
      firstName={ctx.session.firstName}
      announcements={announcements}
      events={events}
      sosItems={sosItems}
      marketItems={marketItems}
      wallNotes={wallNotes}
      readOnly={!ctx.isResident}
    />
  );
}
