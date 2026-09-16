"use client";

import { useState, useTransition } from "react";
import {
  createReport,
  type ReportListItem,
} from "@/lib/actions/moderation";

const PRESETS = [
  "Contenu inapproprié",
  "Spam / pub",
  "Harcèlement",
  "Annonce suspecte",
  "Autre",
] as const;

export function ReportButton({
  targetType,
  targetId,
  isMine,
}: {
  targetType: ReportListItem["targetType"];
  targetId: string;
  isMine: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(PRESETS[0]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (isMine) return null;

  if (done) {
    return (
      <p className="text-xs font-medium text-muted">Signalement envoyé</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="text-xs font-medium text-muted underline-offset-2 transition-colors hover:text-ink hover:underline"
      >
        Signaler
      </button>
    );
  }

  function onSubmit() {
    const finalReason =
      reason === "Autre" ? custom.trim() : reason.trim();
    if (!finalReason) {
      setError("Indique un motif.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createReport({
        targetType,
        targetId,
        reason: finalReason,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDone(true);
      setOpen(false);
    });
  }

  return (
    <div className="mt-2 w-full max-w-sm rounded-xl border border-line bg-wash/60 px-3 py-3">
      <p className="text-xs font-semibold text-ink">Signaler ce contenu</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setReason(preset)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
              reason === preset
                ? "border-accent bg-accent/5 text-accent"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      {reason === "Autre" ? (
        <input
          className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent"
          placeholder="Précise le motif…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
        />
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={onSubmit}
          className="inline-flex h-9 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Envoi…" : "Envoyer"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setOpen(false)}
          className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
