import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ConnexionForm } from "@/components/auth/connexion-form";

export const metadata: Metadata = {
  title: "Connexion — Student-Connect",
  description: "Connecte-toi à Student-Connect pour accéder à ta résidence.",
};

export default function ConnexionPage() {
  return (
    <AuthShell
      title="Connexion"
      subtitle="Accède à l’espace de ta résidence. Si ton compte n’est pas encore validé, tu resteras sur l’écran d’attente."
    >
      <ConnexionForm />
    </AuthShell>
  );
}
