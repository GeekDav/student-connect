import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/landing/contact-form";

export const metadata: Metadata = {
  title: "Nous contacter — Student-Connect",
  description:
    "Candidater à la phase pilote Student-Connect pour ta résidence.",
};

export default function ContactPage() {
  return (
    <div className="min-h-[100svh] bg-background">
      <div className="mx-auto max-w-lg px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-sm font-medium text-accent">
          <Link href="/" className="transition-opacity hover:opacity-70">
            Student-Connect
          </Link>
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
          Nous contacter
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          Phase pilote gratuite : dis-nous qui tu es. On ouvre les espaces au
          fil de l’eau — tu n’es pas inscrit automatiquement.
        </p>
        <div className="mt-8">
          <ContactForm />
        </div>
        <p className="mt-8 text-sm text-muted">
          Déjà partenaire ?{" "}
          <Link
            href="/connexion?next=/gestionnaire"
            className="font-semibold text-accent"
          >
            Connexion gestionnaire
          </Link>
        </p>
      </div>
    </div>
  );
}
