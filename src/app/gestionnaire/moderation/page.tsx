import type { Metadata } from "next";
import { ManagerModeration } from "@/components/manager/manager-moderation";
import { listResidenceReports } from "@/lib/actions/moderation";
import { requireManagerContext } from "@/lib/manager";

export const metadata: Metadata = {
  title: "Modération — Gestionnaire Student-Connect",
};

export default async function GestionnaireModerationPage() {
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

  const items = await listResidenceReports();
  return <ManagerModeration initialItems={items} />;
}
