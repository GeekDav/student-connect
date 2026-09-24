import Link from "next/link";
import type { ReactNode } from "react";

const TONES = {
  official: {
    bar: "bg-accent",
    label: "text-accent",
  },
  wall: {
    bar: "bg-ink/70",
    label: "text-ink",
  },
  events: {
    bar: "bg-accent",
    label: "text-accent",
  },
  sos: {
    bar: "bg-[#c9853a]",
    label: "text-[#9a4b1a]",
  },
  market: {
    bar: "bg-[#1d4f7a]",
    label: "text-[#1d4f7a]",
  },
} as const;

export type FeedSectionTone = keyof typeof TONES;

/**
 * En-tête de section du feed accueil — lisible en scroll (sticky + barre teintée).
 */
export function FeedSectionHeader({
  title,
  tone,
  href,
  linkLabel = "Tout voir",
  subtitle,
}: {
  title: string;
  tone: FeedSectionTone;
  href?: string;
  linkLabel?: string;
  subtitle?: ReactNode;
}) {
  const t = TONES[tone];

  return (
    <header className="sticky top-[3.25rem] z-[9] -mx-4 mb-1 border-b border-line/70 bg-background/92 px-4 py-3 backdrop-blur-md sm:top-[3.5rem] sm:-mx-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-9 w-1.5 shrink-0 rounded-full ${t.bar}`}
            aria-hidden
          />
          <div className="min-w-0">
            <h2
              className={`font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl`}
            >
              {title}
            </h2>
            {subtitle ? (
              <div className={`mt-0.5 text-sm ${t.label} opacity-80`}>
                {subtitle}
              </div>
            ) : null}
          </div>
        </div>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-accent transition-opacity hover:opacity-70"
          >
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </header>
  );
}
