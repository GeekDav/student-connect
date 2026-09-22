"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BackToTop } from "@/components/ui/back-to-top";
import { LogoutButton } from "@/components/ui/logout-button";

const NAV = [
  { href: "/gestionnaire", label: "Dashboard", exact: true },
  { href: "/gestionnaire/abonnement", label: "Abonnement", exact: false },
  { href: "/gestionnaire/invitations", label: "Invitations", exact: false },
  { href: "/gestionnaire/inscriptions", label: "Inscriptions", exact: false },
  { href: "/gestionnaire/residents", label: "Résidents", exact: false },
  { href: "/gestionnaire/annonces", label: "Annonces", exact: false },
  { href: "/gestionnaire/moderation", label: "Modération", exact: false },
  { href: "/gestionnaire/compte", label: "Compte", exact: false },
] as const;

export function ManagerShell({
  children,
  residenceName,
}: {
  children: ReactNode;
  residenceName: string;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Link
                href="/gestionnaire"
                className="font-display text-sm font-semibold tracking-wide text-accent transition-opacity hover:opacity-70"
              >
                Student-Connect
              </Link>
              <p className="mt-0.5 text-xs font-medium text-muted">
                Espace gestionnaire
              </p>
              <h1 className="mt-1 font-display text-lg font-semibold text-ink sm:text-xl">
                {residenceName}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Site public
              </Link>
              <LogoutButton />
            </div>
          </div>

          <nav aria-label="Navigation gestionnaire">
            <ul className="flex gap-1 overflow-x-auto pb-1">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                        active
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-wash hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
      <BackToTop offset={360} />
    </div>
  );
}
