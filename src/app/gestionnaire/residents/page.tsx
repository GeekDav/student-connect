import type { Metadata } from "next";
import { ManagerResidents } from "@/components/manager/manager-residents";
import { listResidenceMembers } from "@/lib/actions/manager-memberships";
import { requireManagerContext } from "@/lib/manager";

export const metadata: Metadata = {
  title: "Résidents — Gestionnaire Student-Connect",
  description:
    "Gère les résidents actifs et retire ceux qui quittent la résidence.",
};

export default async function GestionnaireResidentsPage() {
  try {
    await requireManagerContext();
  } catch {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Aucune résidence liée
        </h2>
        <p className="mt-3 text-muted">
          Ce compte gestionnaire n’a pas encore de résidence.
        </p>
      </div>
    );
  }

  const members = await listResidenceMembers();
  return <ManagerResidents initialMembers={members} />;
}
