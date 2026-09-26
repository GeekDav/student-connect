"use server";

import { listStudentAnnouncements, type AnnouncementItem } from "@/lib/actions/announcements";
import { listResidenceEvents, type EventItem } from "@/lib/actions/events";
import { listResidenceMarket, type MarketItem } from "@/lib/actions/marketplace";
import { listResidenceSos, type SosItem } from "@/lib/actions/sos";
import { listWallNotes, type WallNoteItem } from "@/lib/actions/wall";

export type AccueilLiveSnapshot = {
  announcements: AnnouncementItem[];
  events: EventItem[];
  sosItems: SosItem[];
  marketItems: MarketItem[];
  wallNotes: WallNoteItem[];
};

/** Un seul round-trip pour le live Accueil (au lieu de 5 polls). */
export async function listAccueilLiveSnapshot(): Promise<AccueilLiveSnapshot> {
  const [announcements, events, sosItems, marketItems, wallNotes] =
    await Promise.all([
      listStudentAnnouncements(),
      listResidenceEvents(),
      listResidenceSos(),
      listResidenceMarket(),
      listWallNotes(),
    ]);

  return { announcements, events, sosItems, marketItems, wallNotes };
}
