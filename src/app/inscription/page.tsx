import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { InscriptionForm } from "@/components/auth/inscription-form";
import { listActiveResidences } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inscription — Student-Connect",
  description:
    "Crée ton compte Student-Connect et rejoins ta résidence partenaire.",
};

export default async function InscriptionPage() {
  const residences = await listActiveResidences();

  return (
    <AuthShell
      title="Créer mon compte"
      subtitle="Trois étapes : ton compte, ta résidence, ton profil. L’accès s’ouvre après validation du gestionnaire."
    >
      <InscriptionForm residences={residences} />
    </AuthShell>
  );
}
