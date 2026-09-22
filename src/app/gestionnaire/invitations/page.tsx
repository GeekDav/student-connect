import type { Metadata } from "next";
import { ManagerInvitations } from "@/components/manager/manager-invitations";
import { listResidenceInvitations } from "@/lib/actions/invitations";
import { requireManagerContext } from "@/lib/manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Invitations — Gestionnaire",
  description: "Crée et partage des invitations pour ta résidence.",
};

export default async function ManagerInvitationsPage() {
  await requireManagerContext();
  const items = await listResidenceInvitations();

  return <ManagerInvitations initialItems={items} />;
}
