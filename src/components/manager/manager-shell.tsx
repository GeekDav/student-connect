"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BackToTop } from "@/components/ui/back-to-top";
import { LogoutButton } from "@/components/ui/logout-button";

const NAV = [
  { href: "/gestionnaire", label: "Dashboard", short: "Accueil", exact: true },
  {
    href: "/gestionnaire/abonnement",
    label: "Offre",
    short: "Offre",
    exact: false,
  },
  {
    href: "/gestionnaire/invitations",
    label: "Invitations",
    short: "Invites",
    exact: false,
  },
  {
    href: "/gestionnaire/inscriptions",
    label: "Inscriptions",
    short: "Demandes",
    exact: false,
  },
  {
    href: "/gestionnaire/residents",
    label: "Résidents",
    short: "Résidents",
    exact: false,
  },
  {
    href: "/gestionnaire/annonces",
    label: "Annonces",
    short: "Annonces",
    exact: false,
  },
  {
    href: "/gestionnaire/moderation",
    label: "Modération",
    short: "Signaux",
    exact: false,
  },
  { href: "/gestionnaire/compte", label: "Compte", short: "Compte", exact: false },
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
            <div className="min-w-0">
              <Link
                href="/gestionnaire"
                className="font-display text-sm font-semibold tracking-wide text-accent transition-opacity hover:opacity-70"
              >
                Student-Connect
              </Link>
              <p className="mt-0.5 text-xs font-medium text-muted">
                Espace gestionnaire
              </p>
              <h1 className="mt-1 truncate font-display text-lg font-semibold text-ink sm:text-xl">
                {residenceName}
              </h1>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Link
                href="/"
                className="hidden text-sm font-medium text-muted transition-colors hover:text-ink sm:inline"
              >
                Site public
              </Link>
              <LogoutButton />
            </div>
          </div>

          <nav aria-label="Navigation gestionnaire" className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-surface to-transparent sm:hidden" />
            <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      className={`inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors sm:px-3.5 ${
                        active
                          ? "bg-accent text-white"
                          : "text-muted hover:bg-wash hover:text-ink"
                      }`}
                    >
                      <span className="sm:hidden">{item.short}</span>
                      <span className="hidden sm:inline">{item.label}</span>
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
