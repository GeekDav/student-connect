import type { Metadata } from "next";
import { ResidentsDirectory } from "@/components/app/residents-directory";
import { listResidenceDirectory } from "@/lib/actions/residents";
import { requireActiveStudent } from "@/lib/student";

export const metadata: Metadata = {
  title: "Résidents — Student-Connect",
  description:
    "Annuaire de ta résidence : filtre par filière, passion ou nationalité.",
};

export default async function ResidentsPage() {
  await requireActiveStudent();
  const residents = await listResidenceDirectory();
  return <ResidentsDirectory initialResidents={residents} />;
}
