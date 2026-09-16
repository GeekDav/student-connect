"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/ui/logout-button";

const NAV = [
  { href: "/accueil", label: "Accueil" },
  { href: "/residents", label: "Résidents" },
  { href: "/evenements", label: "Événements" },
  { href: "/sos", label: "SOS" },
  { href: "/profil", label: "Profil" },
] as const;

export function AppShell({
  children,
  residenceName,
  firstName,
  lastName,
  avatarUrl,
}: {
  children: ReactNode;
  residenceName: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <div className="min-h-[100svh]">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="min-w-0">
            <Link
              href="/accueil"
              className="font-display text-sm font-semibold tracking-wide text-ink transition-opacity hover:opacity-70"
            >
              Student-Connect
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted">{residenceName}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/messages"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Messages
            </Link>
            <Link
              href="/recyclerie"
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Recyclerie
            </Link>
            <LogoutButton className="hidden text-sm font-medium text-muted transition-colors hover:text-ink disabled:opacity-60 sm:inline" />
            <Link
              href="/profil"
              className="transition-transform hover:-translate-y-0.5"
              aria-label="Mon profil"
            >
              <Avatar name={fullName} src={avatarUrl} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6 sm:pb-10 sm:pt-8">
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden"
        aria-label="Navigation principale"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
                    active ? "text-accent" : "text-muted hover:text-ink"
                  }`}
                >
                  <span
                    className={`h-1 w-1 rounded-full transition-colors ${
                      active ? "bg-accent" : "bg-transparent"
                    }`}
                    aria-hidden
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-line px-4 py-2 text-center sm:hidden">
          <LogoutButton className="text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-60" />
        </div>
      </nav>

      <nav
        className="mx-auto hidden max-w-2xl px-6 pb-10 sm:block"
        aria-label="Navigation desktop"
      >
        <ul className="flex flex-wrap gap-2 border-t border-line pt-6">
          {[
            ...NAV,
            { href: "/recyclerie", label: "Recyclerie" },
            { href: "/messages", label: "Messages" },
          ].map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:bg-wash hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="ml-auto">
            <LogoutButton className="inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-medium text-muted transition-colors hover:bg-wash hover:text-ink disabled:opacity-60" />
          </li>
        </ul>
      </nav>
    </div>
  );
}
