import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-[100svh] bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 0% 0%, rgba(12,107,92,0.10), transparent 55%), radial-gradient(ellipse 55% 45% at 100% 10%, rgba(19,32,41,0.05), transparent 50%)",
        }}
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex max-w-lg items-center justify-between px-5 py-6 sm:px-6">
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
      </header>

      <main className="relative z-10 mx-auto w-full max-w-lg px-5 pb-16 sm:px-6">
        <div className="animate-hero-rise">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{subtitle}</p>
        </div>
        <div className="animate-hero-rise-delay mt-10">{children}</div>
      </main>
    </div>
  );
}
