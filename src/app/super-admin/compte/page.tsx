import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/ui/change-password-form";

export const metadata: Metadata = {
  title: "Compte — Super-admin — Student-Connect",
};

export default function SuperAdminComptePage() {
  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Compte
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Change le mot de passe du compte super-admin.
        </p>
      </div>
      <div className="animate-hero-rise-delay mt-10 max-w-md">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
