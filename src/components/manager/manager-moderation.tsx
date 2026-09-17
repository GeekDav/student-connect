"use client";

import { useMemo, useState, useTransition } from "react";
import {
  resolveReport,
  type ReportListItem,
} from "@/lib/actions/moderation";

function typeLabel(type: ReportListItem["targetType"]) {
  switch (type) {
    case "event":
      return "Événement";
    case "sos":
      return "SOS";
    case "recyclerie":
      return "Recyclerie";
    case "message":
      return "Message";
    case "wall":
      return "Petit mur";
    case "wall_reply":
      return "Réponse au mur";
  }
}

export function ManagerModeration({
  initialItems,
}: {
  initialItems: ReportListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const open = useMemo(
    () => items.filter((item) => item.status === "open"),
    [items],
  );
  const closed = useMemo(
    () => items.filter((item) => item.status !== "open"),
    [items],
  );

  function onResolve(id: string, action: "removed" | "dismissed") {
    setError(null);
    startTransition(async () => {
      const result = await resolveReport(id, action);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setItems((prev) => {
        const resolved = result.item;
        if (!resolved) return prev;

        return prev.map((item) => {
          if (item.id === id) return resolved;
          if (
            item.status === "open" &&
            item.targetType === resolved.targetType &&
            item.targetId === resolved.targetId
          ) {
            return { ...item, status: resolved.status };
          }
          return item;
        });
      });
    });
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Modération
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Traite les signalements : masquer un contenu ou classer sans suite.
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="animate-hero-rise-delay mt-10">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Ouverts · {open.length}
        </h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {open.map((item) => (
            <li key={item.id} className="py-6">
              <p className="text-xs font-semibold text-[#9a4b1a]">
                {typeLabel(item.targetType)}
              </p>
              <h4 className="mt-2 font-display text-lg font-semibold text-ink">
                {item.targetLabel}
              </h4>
              {item.targetBody ? (
                <div className="mt-3 rounded-xl border border-line bg-wash/60 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Contenu signalé
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {item.targetBody}
                  </p>
                </div>
              ) : null}
              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Motif du signalement
                </p>
                <p className="mt-1 text-base leading-relaxed text-muted">
                  {item.reason}
                </p>
              </div>
              <p className="mt-3 text-xs text-muted">
                Signalé par {item.reporter} · {item.reportedAt}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onResolve(item.id, "removed")}
                  className="inline-flex h-11 items-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-60"
                >
                  Masquer le contenu
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onResolve(item.id, "dismissed")}
                  className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
                >
                  Classer sans suite
                </button>
              </div>
            </li>
          ))}
          {open.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              Aucun signalement ouvert.
            </li>
          ) : null}
        </ul>
      </section>

      {closed.length > 0 ? (
        <section className="mt-12">
          <h3 className="font-display text-sm font-semibold tracking-wide text-muted">
            Traités · {closed.length}
          </h3>
          <ul className="mt-2 divide-y divide-line border-y border-line opacity-80">
            {closed.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">{item.targetLabel}</p>
                  <p className="text-xs text-muted">
                    {typeLabel(item.targetType)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-muted">
                  {item.status === "removed" ? "Masqué" : "Sans suite"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
