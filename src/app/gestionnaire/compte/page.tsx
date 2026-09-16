import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/ui/change-password-form";

export const metadata: Metadata = {
  title: "Compte — Gestionnaire — Student-Connect",
};

export default function GestionnaireComptePage() {
  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Compte
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Mets à jour le mot de passe de ton espace gestionnaire.
        </p>
      </div>
      <div className="animate-hero-rise-delay mt-10 max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
