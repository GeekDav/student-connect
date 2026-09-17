import Link from "next/link";
import { WallNotesSection } from "@/components/app/wall-notes-section";
import { ViewAnnouncementImage } from "@/components/ui/view-announcement-image";
import type { AnnouncementItem } from "@/lib/actions/announcements";
import type { EventItem } from "@/lib/actions/events";
import type { MarketItem } from "@/lib/actions/marketplace";
import type { SosItem } from "@/lib/actions/sos";
import type { WallNoteItem } from "@/lib/actions/wall";

export function AccueilFeed({
  firstName,
  announcements,
  events,
  sosItems,
  marketItems,
  wallNotes,
}: {
  firstName: string;
  announcements: AnnouncementItem[];
  events: EventItem[];
  sosItems: SosItem[];
  marketItems: MarketItem[];
  wallNotes: WallNoteItem[];
}) {
  const openEvents = events.filter((e) => e.spotsTaken < e.spotsTotal);
  const openSos = sosItems.filter((s) => s.status !== "closed");
  const activeMarket = marketItems.filter((m) => m.status !== "gone");

  const todayBits = [
    openEvents.length > 0
      ? `${openEvents.length} event${openEvents.length > 1 ? "s" : ""} ouvert${openEvents.length > 1 ? "s" : ""}`
      : null,
    openSos.length > 0
      ? `${openSos.length} SOS`
      : null,
    activeMarket.length > 0
      ? `${activeMarket.length} annonce${activeMarket.length > 1 ? "s" : ""} recyclerie`
      : null,
    announcements.length > 0
      ? `${announcements.length} annonce${announcements.length > 1 ? "s" : ""} officielle${announcements.length > 1 ? "s" : ""}`
      : null,
  ].filter(Boolean) as string[];

  return (
    <div>
      <div className="animate-hero-rise">
        <p className="text-sm text-muted">Bonjour {firstName}</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink">
          Dans ta résidence
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
          Annonces, activités et coups de main — uniquement ici.
        </p>
      </div>

      <div className="animate-hero-rise-delay mt-6 rounded-2xl border border-line bg-wash/70 px-4 py-4 sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
          Aujourd’hui
        </p>
        {todayBits.length > 0 ? (
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {todayBits.join(" · ")}
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-muted">
            Calme pour l’instant — propose un event, un SOS ou un petit mot.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm">
          <Link href="/evenements" className="font-medium text-accent hover:opacity-70">
            Events
          </Link>
          <Link href="/sos" className="font-medium text-accent hover:opacity-70">
            SOS
          </Link>
          <Link href="/recyclerie" className="font-medium text-accent hover:opacity-70">
            Recyclerie
          </Link>
        </div>
      </div>

      <div className="animate-hero-rise-delay mt-8 flex gap-2 overflow-x-auto pb-1">
        {[
          { href: "/evenements", label: "Proposer un event" },
          { href: "/sos", label: "Lancer un SOS" },
          { href: "/recyclerie", label: "Publier un don" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="shrink-0 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-accent/40 hover:bg-wash"
          >
            {action.label}
          </Link>
        ))}
      </div>

      <section className="animate-hero-rise-delay-2 mt-10">
        <h2 className="font-display text-sm font-semibold tracking-wide text-accent">
          Tableau d’affichage
        </h2>
        {announcements.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {announcements.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-accent/20 bg-accent/[0.04] px-5 py-5"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Annonce officielle
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {item.body}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <p className="text-xs text-muted">
                    Administration · {item.publishedAt}
                  </p>
                  {item.imageUrl ? (
                    <ViewAnnouncementImage
                      src={item.imageUrl}
                      title={item.title}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Aucune annonce officielle pour le moment.
          </p>
        )}
      </section>

      <WallNotesSection initialNotes={wallNotes} />

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
            Événements récents
          </h2>
          <Link
            href="/evenements"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
          >
            Tout voir
          </Link>
        </div>
        {openEvents.length > 0 ? (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {openEvents.slice(0, 4).map((item) => (
              <li key={item.id} className="py-6">
                <p className="text-xs font-semibold text-ink">Micro-événement</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
                <p className="mt-2 text-sm font-medium text-ink">
                  {item.whenLabel}
                  <span className="font-normal text-muted"> · {item.where}</span>
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Pas encore d’événement.{" "}
            <Link
              href="/evenements"
              className="font-medium text-ink hover:opacity-70"
            >
              Propose le premier
            </Link>
            .
          </p>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
            SOS en cours
          </h2>
          <Link
            href="/sos"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
          >
            Tout voir
          </Link>
        </div>
        {openSos.length > 0 ? (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {openSos.slice(0, 4).map((item) => (
              <li key={item.id} className="py-6">
                <p className="text-xs font-semibold text-[#9a4b1a]">SOS</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {item.author} · {item.timeLabel}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Aucun SOS ouvert pour le moment.
          </p>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
            Recyclerie
          </h2>
          <Link
            href="/recyclerie"
            className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
          >
            Tout voir
          </Link>
        </div>
        {activeMarket.length > 0 ? (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {activeMarket.slice(0, 4).map((item) => (
              <li key={item.id} className="py-6">
                <p className="text-xs font-semibold text-[#1d4f7a]">
                  {item.type === "don" ? "Don" : "Vente"}
                  {item.priceLabel ? ` · ${item.priceLabel}` : ""}
                </p>
                <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                  {item.title}
                </h3>
                <p className="mt-2 text-base leading-relaxed text-muted">
                  {item.description}
                </p>
                <p className="mt-3 text-xs text-muted">
                  {item.location} · {item.author} · {item.timeLabel}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Aucune annonce pour le moment.{" "}
            <Link
              href="/recyclerie"
              className="font-medium text-ink hover:opacity-70"
            >
              Publie un don
            </Link>
            .
          </p>
        )}
      </section>
    </div>
  );
}
