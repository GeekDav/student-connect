import Link from "next/link";
import type { ReactNode } from "react";

export function LegalShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100svh] bg-background">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5 sm:px-6">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-wide text-ink transition-opacity hover:opacity-70"
          >
            Student-Connect
          </Link>
          <Link
            href="/"
            className="text-sm text-muted transition-colors hover:text-ink"
          >
            Retour
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
        <h1 className="animate-hero-rise font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <div className="animate-hero-rise-delay prose-legal mt-8 space-y-6 text-base leading-relaxed text-muted">
          {children}
        </div>
        <p className="mt-12 text-sm text-muted">
          <Link href="/" className="font-medium text-ink hover:opacity-70">
            ← Retour à l’accueil
          </Link>
        </p>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}
