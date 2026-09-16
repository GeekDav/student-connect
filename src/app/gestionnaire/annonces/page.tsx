import type { Metadata } from "next";
import { ManagerAnnonces } from "@/components/manager/manager-annonces";
import { listManagerAnnouncements } from "@/lib/actions/announcements";
import { requireManagerContext } from "@/lib/manager";

export const metadata: Metadata = {
  title: "Annonces — Gestionnaire Student-Connect",
};

export default async function GestionnaireAnnoncesPage() {
  try {
    await requireManagerContext();
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Aucune résidence liée
        </h2>
      </div>
    );
  }

  const items = await listManagerAnnouncements();
  return <ManagerAnnonces initialItems={items} />;
}
