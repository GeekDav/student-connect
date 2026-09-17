"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  toggleResidenceStatus,
  updateManagerEmail,
  type PlatformResidenceItem,
} from "@/lib/actions/super-admin";

export function ResidencesList({
  initialItems,
}: {
  initialItems: PlatformResidenceItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [emailDraft, setEmailDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function onToggle(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await toggleResidenceStatus(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: item.status === "active" ? "paused" : "active",
              }
            : item,
        ),
      );
    });
  }

  function startEditEmail(item: PlatformResidenceItem) {
    setError(null);
    setEditingId(item.id);
    setEmailDraft(item.managerEmail === "—" ? "" : item.managerEmail);
  }

  function saveEmail(residenceId: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateManagerEmail(residenceId, emailDraft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.id === residenceId
            ? { ...item, managerEmail: result.managerEmail }
            : item,
        ),
      );
      setEditingId(null);
    });
  }

  return (
    <div>
      <div className="animate-hero-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Résidences partenaires
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            Crée une résidence et le compte gestionnaire associé. Phase Alpha :
            uniquement les partenaires que tu actives ici.
          </p>
        </div>
        <Link
          href="/super-admin/nouvelle-residence"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Créer une résidence
        </Link>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="animate-hero-rise-delay mt-8 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-display text-lg font-semibold text-ink">
                    {item.name}
                  </h3>
                  <span
                    className={`text-xs font-semibold ${
                      item.status === "active" ? "text-accent" : "text-muted"
                    }`}
                  >
                    {item.status === "active" ? "Active" : "En pause"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {item.city} · {item.operator}
                </p>
                <p className="mt-1 text-sm text-muted">{item.address}</p>
                <p className="mt-3 text-sm text-ink">
                  Gestionnaire : {item.managerName}
                </p>
                {editingId === item.id ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      className="h-10 min-w-[14rem] flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                      placeholder="email@residence.fr"
                    />
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => saveEmail(item.id)}
                      className="inline-flex h-10 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs font-medium text-muted hover:text-ink"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    {item.managerEmail}
                    {item.managerEmail !== "—" ? (
                      <>
                        {" · "}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => startEditEmail(item)}
                          className="font-semibold text-accent hover:underline disabled:opacity-60"
                        >
                          Modifier l’e-mail
                        </button>
                      </>
                    ) : null}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  Créée le {item.createdAt} · {item.activeStudents} actifs ·{" "}
                  {item.pendingStudents} en attente
                </p>
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onToggle(item.id)}
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
              >
                {item.status === "active" ? "Mettre en pause" : "Réactiver"}
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="py-12 text-center text-sm text-muted">
            Aucune résidence. Crée la première pour démarrer l’alpha.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
