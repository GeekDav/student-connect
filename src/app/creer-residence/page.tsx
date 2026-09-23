import type { Metadata } from "next";
import Link from "next/link";
import { isBillingEnabled } from "@/lib/billing-mode";
import { CreateResidenceForm } from "@/components/landing/create-residence-form";
import { getPublicPricing } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Équiper ma résidence — Student-Connect",
  description:
    "Phase pilote Student-Connect : résidences partenaires ouvertes avec l’équipe.",
};

export default async function CreateResidencePage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  if (!isBillingEnabled()) {
    return (
      <div className="min-h-[100svh] bg-background">
        <div className="mx-auto max-w-lg px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-sm font-medium text-accent">
            <Link href="/" className="transition-opacity hover:opacity-70">
              Student-Connect
            </Link>
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
            Phase pilote
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            La création d’espace en ligne (paiement) est fermée pour le moment.
            Student-Connect est{" "}
            <strong className="font-semibold text-ink">gratuit</strong> pour un
            nombre limité de résidences partenaires : on ouvre les comptes avec
            toi.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Déjà partenaire ? Connecte-toi. Sinon, vois la page d’accueil pour
            comprendre le programme pilote.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/connexion?next=/gestionnaire"
              className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
            >
              Connexion gestionnaire
            </Link>
            <Link
              href="/#partenaires"
              className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
            >
              Voir la phase pilote
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const [pricing, params] = await Promise.all([
    getPublicPricing(),
    searchParams,
  ]);

  return (
    <div className="min-h-[100svh] bg-background">
      <CreateResidenceForm
        pricing={pricing}
        canceled={params.checkout === "cancel"}
      />
    </div>
  );
}
