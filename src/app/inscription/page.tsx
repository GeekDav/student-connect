import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { InscriptionForm } from "@/components/auth/inscription-form";
import { listActiveResidences } from "@/lib/actions/auth";
import { resolveInviteCode } from "@/lib/actions/invitations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription — Student-Connect",
  description:
    "Crée ton compte Student-Connect et rejoins ta résidence partenaire.",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const residences = await listActiveResidences();

  let initialInvite = null;
  let inviteError: string | null = null;
  if (params.invite?.trim()) {
    initialInvite = await resolveInviteCode(params.invite);
    if (!initialInvite) {
      inviteError =
        "Cette invitation est invalide ou expirée. Tu peux quand même t’inscrire en choisissant ta résidence.";
    }
  }

  return (
    <AuthShell
      title="Créer mon compte"
      subtitle={
        initialInvite
          ? `Invitation pour ${initialInvite.residenceName} — accès immédiat après inscription.`
          : "Compte, résidence, profil. Avec une invitation : accès direct. Sinon : validation du gestionnaire."
      }
    >
      <InscriptionForm
        residences={residences}
        initialInvite={initialInvite}
        inviteError={inviteError}
      />
    </AuthShell>
  );
}
