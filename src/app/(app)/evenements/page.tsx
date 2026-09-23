import type { Metadata } from "next";
import { EventsBoard } from "@/components/app/events-board";
import { listResidenceEvents } from "@/lib/actions/events";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "Événements — Student-Connect",
  description:
    "Propose ou rejoins un micro-événement dans ta résidence étudiante.",
};

export default async function EvenementsPage() {
  const ctx = await requireActiveStudent();
  const events = await listResidenceEvents();
  return <EventsBoard initialEvents={events} readOnly={!ctx.isResident} />;
}
