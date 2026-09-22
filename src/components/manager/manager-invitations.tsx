"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  createResidenceInvitation,
  revokeResidenceInvitation,
  type InvitationItem,
} from "@/lib/actions/invitations";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function ManagerInvitations({
  initialItems,
}: {
  initialItems: InvitationItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function absoluteInviteUrl(path: string) {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  function flashCopied(key: string) {
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createResidenceInvitation({
        label: label.trim() || undefined,
        maxUses: maxUses.trim() ? Number(maxUses) : null,
        expiresInDays: expiresInDays.trim()
          ? Number(expiresInDays)
          : 30,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.item) {
        setItems((prev) => [result.item!, ...prev]);
      }
      setLabel("");
      setMaxUses("");
      setExpiresInDays("30");
    });
  }

  function onRevoke(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await revokeResidenceInvitation(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.item) {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? result.item! : item)),
        );
      }
    });
  }

  async function onCopyLink(item: InvitationItem) {
    // Lien absolu = partage WhatsApp / mail. Le chemin seul ne s’ouvre pas ailleurs.
    const url = absoluteInviteUrl(item.invitePath);
    try {
      await navigator.clipboard.writeText(url);
      flashCopied(`${item.id}:link`);
    } catch {
      setError("Impossible de copier. Sélectionne le lien manuellement.");
    }
  }

  async function onCopyCode(item: InvitationItem) {
    try {
      await navigator.clipboard.writeText(item.code);
      flashCopied(`${item.id}:code`);
    } catch {
      setError("Impossible de copier. Sélectionne le code manuellement.");
    }
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Invitations
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Crée un lien à envoyer (WhatsApp, mail…) ou un code à coller à
          l’inscription. « Copier le lien » prend l’URL complète — c’est normal
          et mieux pour partager. « Copier le code » pour le code seul.
        </p>
      </div>

      <form
        onSubmit={onCreate}
        className="animate-hero-rise-delay mt-8 space-y-4 rounded-2xl border border-line bg-surface px-5 py-5"
      >
        <div>
          <label htmlFor="invite-label" className="text-sm font-medium text-ink">
            Libellé (optionnel)
          </label>
          <input
            id="invite-label"
            className={fieldClass}
            placeholder="Ex. Promo septembre, Hall A…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="invite-max" className="text-sm font-medium text-ink">
              Nombre max d’utilisations
            </label>
            <input
              id="invite-max"
              type="number"
              min={1}
              max={500}
              className={fieldClass}
              placeholder="Illimité"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted">Vide = illimité.</p>
          </div>
          <div>
            <label
              htmlFor="invite-days"
              className="text-sm font-medium text-ink"
            >
              Expire dans (jours)
            </label>
            <input
              id="invite-days"
              type="number"
              min={1}
              max={365}
              className={fieldClass}
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
        >
          {isPending ? "Création…" : "Créer une invitation"}
        </button>
      </form>

      <ul className="animate-hero-rise-delay-2 mt-10 divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={item.id} className="py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold text-ink">
                  {item.label || "Invitation"}
                </p>
                <p className="mt-1 font-mono text-sm text-accent">{item.code}</p>
                <p className="mt-2 text-xs text-muted break-all">
                  {item.invitePath}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {item.usedCount}
                  {item.maxUses != null ? ` / ${item.maxUses}` : ""} utilisation
                  {item.usedCount > 1 ? "s" : ""}
                  {item.expiresAt
                    ? ` · expire le ${new Date(item.expiresAt).toLocaleDateString("fr-FR")}`
                    : ""}
                  {item.revoked
                    ? " · révoquée"
                    : item.active
                      ? " · active"
                      : " · expirée"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.active ? (
                  <>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onCopyLink(item)}
                      className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-wash"
                    >
                      {copiedKey === `${item.id}:link`
                        ? "Lien copié"
                        : "Copier le lien"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onCopyCode(item)}
                      className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-wash"
                    >
                      {copiedKey === `${item.id}:code`
                        ? "Code copié"
                        : "Copier le code"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onRevoke(item.id)}
                      className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:bg-wash hover:text-ink"
                    >
                      Révoquer
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="py-12 text-center text-sm text-muted">
            Aucune invitation pour le moment. Crée la première ci-dessus.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
