"use client";

import { useMemo, useState, useTransition } from "react";
import {
  decideMembership,
  type MembershipListItem,
} from "@/lib/actions/manager-memberships";

export function ManagerInscriptions({
  initialItems,
}: {
  initialItems: MembershipListItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pending = useMemo(
    () => items.filter((item) => item.status === "pending"),
    [items],
  );
  const decided = useMemo(
    () => items.filter((item) => item.status !== "pending"),
    [items],
  );

  function decide(id: string, status: "accepted" | "refused") {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const result = await decideMembership(id, status);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item)),
      );
    });
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Inscriptions
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Vérifie le n° de chambre avec ta liste locataires, puis accepte ou
          refuse. L’étudiant passe de « en attente » à actif (ou refusé).
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="animate-hero-rise-delay mt-10">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          En attente · {pending.length}
        </h3>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {pending.map((item) => {
            const busy = isPending && pendingId === item.id;
            return (
              <li key={item.id} className="py-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-display text-lg font-semibold text-ink">
                      {item.firstName} {item.lastName}
                    </h4>
                    <p className="mt-1 text-sm text-ink">
                      Chambre {item.roomNumber}
                      <span className="text-muted">
                        {" "}
                        · {item.fieldOfStudy} · {item.school}
                      </span>
                    </p>
                    <p className="mt-2 text-sm text-muted">{item.email}</p>
                    <p className="mt-1 text-xs text-muted">{item.requestedAt}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decide(item.id, "accepted")}
                      className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
                    >
                      {busy ? "…" : "Accepter"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => decide(item.id, "refused")}
                      className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
          {pending.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              Aucune demande en attente.
            </li>
          ) : null}
        </ul>
      </section>

      {decided.length > 0 ? (
        <section className="mt-12">
          <h3 className="font-display text-sm font-semibold tracking-wide text-muted">
            Traitées · {decided.length}
          </h3>
          <ul className="mt-2 divide-y divide-line border-y border-line opacity-80">
            {decided.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="font-medium text-ink">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-xs text-muted">Chambre {item.roomNumber}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    item.status === "accepted" ? "text-accent" : "text-muted"
                  }`}
                >
                  {item.status === "accepted" ? "Accepté" : "Refusé"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
