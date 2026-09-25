"use client";

import { useEffect, useState } from "react";
import { FeedSectionHeader } from "@/components/app/feed-section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";
import { ViewAnnouncementImage } from "@/components/ui/view-announcement-image";
import {
  markAnnouncementsRead,
  type AnnouncementItem,
} from "@/lib/actions/announcements";

const PAGE_SIZE = 5;

export function AccueilAnnouncements({
  initial,
}: {
  initial: AnnouncementItem[];
}) {
  const [items, setItems] = useState(initial);
  const { visible, remaining, showMore } = useLoadMore(items, PAGE_SIZE);

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    const unreadIds = initial.filter((a) => a.unread).map((a) => a.id);
    if (unreadIds.length === 0) return;

    let cancelled = false;
    void markAnnouncementsRead(unreadIds).then((result) => {
      if (cancelled || !result.ok) return;
      setItems((prev) => prev.map((a) => ({ ...a, unread: false })));
    });

    return () => {
      cancelled = true;
    };
  }, [initial]);

  return (
    <section className="mt-10">
      <FeedSectionHeader
        title="Tableau d’affichage"
        tone="official"
        subtitle="Annonces de la résidence"
      />
      {items.length > 0 ? (
        <>
          <ul className="mt-4 space-y-3">
            {visible.map((item) => (
              <li
                key={item.id}
                className={`rounded-2xl border px-5 py-5 ${
                  item.unread
                    ? "border-accent/35 bg-accent/[0.07]"
                    : "border-accent/20 bg-accent/[0.04]"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                    Annonce officielle
                  </p>
                  {item.unread ? (
                    <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Nouveau
                    </span>
                  ) : null}
                </div>
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
          <LoadMoreButton remaining={remaining} onClick={showMore} />
        </>
      ) : (
        <div className="mt-4">
          <EmptyState
            title="Tableau d’affichage vide"
            description="Les annonces officielles de ta résidence apparaîtront ici."
          />
        </div>
      )}
    </section>
  );
}
