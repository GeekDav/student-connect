import type { Metadata } from "next";
import { ManagerInscriptions } from "@/components/manager/manager-inscriptions";
import { listResidenceMemberships } from "@/lib/actions/manager-memberships";
import { requireManagerContext } from "@/lib/manager";

export const metadata: Metadata = {
  title: "Inscriptions — Gestionnaire Student-Connect",
};

export default async function GestionnaireInscriptionsPage() {
  try {
    await requireManagerContext();
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Aucune résidence liée
        </h2>
        <p className="mt-3 text-muted">
          Ce compte gestionnaire n’a pas encore de résidence. Demande au
          super-admin de t’en assigner une.
        </p>
      </div>
    );
  }

  const items = await listResidenceMemberships();
  return <ManagerInscriptions initialItems={items} />;
}
