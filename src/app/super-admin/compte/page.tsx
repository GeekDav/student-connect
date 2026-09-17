import type { Metadata } from "next";
import { ChangeEmailForm } from "@/components/ui/change-email-form";
import { ChangePasswordForm } from "@/components/ui/change-password-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Compte — Super-admin — Student-Connect",
};

export default async function SuperAdminComptePage() {
  const session = await getSession();
  const email = session?.email ?? "";

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Compte
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Gère l’e-mail et le mot de passe du compte super-admin.
        </p>
      </div>
      <div className="animate-hero-rise-delay mt-10 max-w-md space-y-12">
        <section>
          <h3 className="font-display text-lg font-semibold text-ink">
            E-mail
          </h3>
          <div className="mt-4">
            <ChangeEmailForm currentEmail={email} />
          </div>
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
