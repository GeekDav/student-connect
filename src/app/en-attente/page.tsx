import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MembershipStatus } from "@prisma/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "En attente — Student-Connect",
  description:
    "Ton inscription Student-Connect est en attente de validation par ta résidence.",
};

export default async function EnAttentePage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const membership = await prisma.residenceMembership.findFirst({
    where: { userId: session.userId },
    include: { residence: true },
    orderBy: { createdAt: "desc" },
  });

  if (membership?.status === MembershipStatus.ACTIVE) {
    redirect("/accueil");
  }

  if (membership?.status === MembershipStatus.REFUSED) {
    return (
      <AuthShell
        title="Inscription refusée"
        subtitle="Le gestionnaire n’a pas validé ta demande pour cette résidence."
      >
        <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
          <p className="text-base leading-relaxed text-muted">
            Tu peux contacter l’accueil de ta résidence, ou te reconnecter plus
            tard si la situation change.
          </p>
          <Link
            href="/connexion"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="En attente de validation"
      subtitle={
        membership
          ? `Ton compte est créé. Le gestionnaire de ${membership.residence.name} doit encore confirmer que tu habites bien là.`
          : "Ton compte est créé. Le gestionnaire de ta résidence doit encore confirmer que tu habites bien là."
      }
    >
      <div className="rounded-2xl border border-line bg-surface p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent/40 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-accent" />
          </span>
          <p className="font-display text-sm font-semibold text-accent">
            Demande en cours
          </p>
        </div>

        <p className="mt-5 text-base leading-relaxed text-muted">
          Tu pourras accéder au feed dès que ton inscription sera acceptée.
          Reconnecte-toi après validation.
        </p>

        <ul className="mt-6 space-y-3 border-t border-line pt-6 text-sm text-muted">
          <li className="flex gap-3">
            <span className="font-display font-semibold text-accent">1</span>
            <span>Tu as choisi une résidence partenaire</span>
          </li>
          <li className="flex gap-3">
            <span className="font-display font-semibold text-accent">2</span>
            <span>Le gestionnaire vérifie ta demande</span>
          </li>
          <li className="flex gap-3">
            <span className="font-display font-semibold text-accent">3</span>
            <span>Tu accèdes au réseau de ta résidence uniquement</span>
          </li>
        </ul>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/connexion"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
          >
            Se reconnecter plus tard
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-line bg-background px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Retour au site
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
