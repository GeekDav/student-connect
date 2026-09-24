"use client";

import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { FeedSectionHeader } from "@/components/app/feed-section-header";
import { ReportButton } from "@/components/app/report-button";
import { EmptyState } from "@/components/ui/empty-state";
import { EmojiPickerButton } from "@/components/ui/emoji-picker";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";
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
  readOnly = false,
}: {
  initialNotes: WallNoteItem[];
  readOnly?: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { visible, hasMore, remaining, showMore } = useLoadMore(notes, 6);

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
      <FeedSectionHeader
        title="Petit mur"
        tone="wall"
        subtitle={
          readOnly
            ? "Messages des résidents"
            : "1 post / jour · disparaît après 7 jours"
        }
      />

      {!readOnly ? (
      <form onSubmit={onCreate} className="mt-4 space-y-3">
        <textarea
          className={`${fieldClass} min-h-[5rem] resize-y`}
          placeholder="Ex. Qui est partant pour une session révision ce soir ?"
          maxLength={280}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <EmojiPickerButton
              disabled={isPending}
              onPick={(emoji) =>
                setDraft((prev) => (prev + emoji).slice(0, 280))
              }
            />
            <p className="text-xs text-muted">{draft.length}/280</p>
          </div>
          <button
            type="submit"
            disabled={isPending || !draft.trim()}
            className="inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[opacity,background-color] hover:bg-accent-hover disabled:opacity-50"
          >
            Publier
          </button>
        </div>
      </form>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-line border-y border-line">
        {visible.map((note) => {
          const replyDraft = replyDrafts[note.id] ?? "";
          return (
            <li key={note.id} className="py-5">
              <p className="text-[15px] leading-relaxed text-ink">{note.body}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  {note.author} · {note.timeLabel}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {!readOnly && !note.isMine ? (
                    <Link
                      href={`/messages?with=${note.authorId}`}
                      className="text-xs font-semibold text-accent hover:opacity-70"
                    >
                      Message privé
                    </Link>
                  ) : null}
                  {!readOnly ? (
                  <ReportButton
                    targetType="wall"
                    targetId={note.id}
                    isMine={note.isMine}
                  />
                  ) : null}
                  {!readOnly && note.isMine ? (
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
                        {!readOnly && reply.isMine ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => onDeleteReply(note.id, reply.id)}
                            className="text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
                          >
                            Retirer
                          </button>
                        ) : null}
                        {!readOnly && !reply.isMine ? (
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
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}

              {!readOnly ? (
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
                <div className="flex shrink-0 items-center gap-2">
                  <EmojiPickerButton
                    disabled={isPending}
                    align="right"
                    onPick={(emoji) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [note.id]: ((prev[note.id] ?? "") + emoji).slice(
                          0,
                          160,
                        ),
                      }))
                    }
                  />
                  <button
                    type="submit"
                    disabled={isPending || !replyDraft.trim()}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-50"
                  >
                    Répondre
                  </button>
                </div>
              </form>
              ) : null}
            </li>
          );
        })}
        {notes.length === 0 ? (
          <li className="border-0 py-6">
            <EmptyState
              title="Le mur est encore calme"
              description="Pose une question, propose une sortie, ou cherche un voisin qui partage ton domaine."
            />
          </li>
        ) : null}
      </ul>

      {hasMore ? (
        <LoadMoreButton remaining={remaining} onClick={showMore} />
      ) : null}
    </section>
  );
}
