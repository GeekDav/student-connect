import type { Metadata } from "next";
import { SosBoard } from "@/components/app/sos-board";
import { listResidenceSos } from "@/lib/actions/sos";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "SOS — Student-Connect",
  description:
    "Entraide flash entre résidents : lance un SOS ou aide un voisin.",
};

export default async function SosPage() {
  const ctx = await requireActiveStudent();
  const items = await listResidenceSos();
  return <SosBoard initialItems={items} readOnly={!ctx.isResident} />;
}
