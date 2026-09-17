"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { ReportButton } from "@/components/app/report-button";
import {
  createWallNote,
  createWallReply,
  deleteWallNote,
  deleteWallReply,
  type WallNoteItem,
} from "@/lib/actions/wall";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const replyFieldClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function WallNotesSection({
  initialNotes,
}: {
  initialNotes: WallNoteItem[];
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
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

  function onReply(noteId: string, e: FormEvent) {
    e.preventDefault();
    const text = replyDrafts[noteId] ?? "";
    setError(null);
    startTransition(async () => {
      const result = await createWallReply(noteId, text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.reply) {
        setNotes((prev) =>
          prev.map((note) =>
            note.id === noteId
              ? { ...note, replies: [...note.replies, result.reply!] }
              : note,
          ),
        );
        setReplyDrafts((prev) => ({ ...prev, [noteId]: "" }));
      }
    });
  }

  function onDeleteReply(noteId: string, replyId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteWallReply(replyId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                replies: note.replies.filter((r) => r.id !== replyId),
              }
            : note,
        ),
      );
    });
  }

  return (
    <section className="mt-12">
      <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
        Petit mur
      </h2>
      <p className="mt-1 text-sm text-muted">
        Pose une question ou une idée · réponses dessous · 1 post / jour ·
        disparaît après 7 jours
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
        {notes.map((note) => {
          const replyDraft = replyDrafts[note.id] ?? "";
          return (
            <li key={note.id} className="py-5">
              <p className="text-[15px] leading-relaxed text-ink">{note.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  {note.author} · {note.timeLabel}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {!note.isMine ? (
                    <Link
                      href={`/messages?with=${note.authorId}`}
                      className="text-xs font-semibold text-accent hover:opacity-70"
                    >
                      Message privé
                    </Link>
                  ) : null}
                  <ReportButton
                    targetType="wall"
                    targetId={note.id}
                    isMine={note.isMine}
                  />
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
              </div>

              {note.replies.length > 0 ? (
                <ul className="mt-4 space-y-3 border-l-2 border-line pl-4">
                  {note.replies.map((reply) => (
                    <li key={reply.id}>
                      <p className="text-sm leading-relaxed text-ink">
                        {reply.body}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-xs text-muted">
                          {reply.author} · {reply.timeLabel}
                        </p>
                        {reply.isMine ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onDeleteReply(note.id, reply.id)}
                            className="text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
                          >
                            Retirer
                          </button>
                        ) : (
                          <>
                            <Link
                              href={`/messages?with=${reply.authorId}`}
                              className="text-xs font-semibold text-accent hover:opacity-70"
                            >
                              Message
                            </Link>
                            <ReportButton
                              targetType="wall_reply"
                              targetId={reply.id}
                              isMine={false}
                            />
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              <form
                onSubmit={(e) => onReply(note.id, e)}
                className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  className={replyFieldClass}
                  placeholder="Répondre publiquement…"
                  maxLength={160}
                  value={replyDraft}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({
                      ...prev,
                      [note.id]: e.target.value,
                    }))
                  }
                />
                <button
                  type="submit"
                  disabled={isPending || !replyDraft.trim()}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-50"
                >
                  Répondre
                </button>
              </form>
            </li>
          );
        })}
        {notes.length === 0 ? (
          <li className="py-8 text-center text-sm text-muted">
            Aucun petit mot pour l’instant. Lance le premier.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
