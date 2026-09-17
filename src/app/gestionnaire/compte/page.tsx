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
      <div className="animate-hero-rise-delay mt-10 max-w-md space-y-10">
        <section className="rounded-xl border border-line bg-wash/50 px-4 py-4">
          <h3 className="text-sm font-semibold text-ink">E-mail</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            L’e-mail du compte gestionnaire est géré par le{" "}
            <strong className="font-medium text-ink">super-admin</strong> de la
            plateforme (sécurité de la résidence). Contacte-le pour le modifier.
          </p>
        </section>
        <section>
          <h3 className="font-display text-lg font-semibold text-ink">
            Mot de passe
          </h3>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
