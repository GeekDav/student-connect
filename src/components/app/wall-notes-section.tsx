"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  createWallNote,
  deleteWallNote,
  type WallNoteItem,
} from "@/lib/actions/wall";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function WallNotesSection({
  initialNotes,
}: {
  initialNotes: WallNoteItem[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createWallNote(draft);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.item) {
        setNotes((prev) => [result.item!, ...prev]);
      }
      setDraft("");
    });
  }

  function onDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteWallNote(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
        Petit mur
      </h2>
      <p className="mt-1 text-sm text-muted">
        Un message court pour ta résidence · max 1 par jour · 280 caractères
      </p>

      <form onSubmit={onCreate} className="mt-4 space-y-3">
        <textarea
          className={`${fieldClass} min-h-[5rem] resize-y`}
          placeholder="Ex. Qui est partant pour une session révision ce soir ?"
          maxLength={280}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{draft.length}/280</p>
          <button
            type="submit"
            disabled={isPending || !draft.trim()}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[opacity,background-color] hover:bg-accent-hover disabled:opacity-50"
          >
            Publier
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {notes.map((note) => (
          <li key={note.id} className="py-5">
            <p className="text-[15px] leading-relaxed text-ink">{note.body}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted">
                {note.author} · {note.timeLabel}
              </p>
              {note.isMine ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDelete(note.id)}
                  className="text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
                >
                  Retirer
                </button>
              ) : null}
            </div>
          </li>
        ))}
        {notes.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">
            Aucun petit mot pour l’instant. Lance le premier.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
