"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { ReportButton } from "@/components/app/report-button";
import { Avatar } from "@/components/ui/avatar";
import {
  clearConversation,
  deleteMessages,
  getConversation,
  sendMessage,
  type ChatMessage,
  type ConversationDetail,
  type ConversationSummary,
} from "@/lib/actions/messages";

const fieldClass =
  "w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

export function MessagesBoard({
  initialConversations,
  initialActiveId,
  initialDetail,
  bootstrapError,
}: {
  initialConversations: ConversationSummary[];
  initialActiveId?: string | null;
  initialDetail?: ConversationDetail | null;
  bootstrapError?: string | null;
}) {
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(
    initialActiveId ?? null,
  );
  const [detail, setDetail] = useState<ConversationDetail | null>(
    initialDetail ?? null,
  );
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(bootstrapError ?? null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const activeSummary = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  useEffect(() => {
    if (!activeId) {
      setDetail(null);
      return;
    }
    if (detail?.id === activeId) return;

    startTransition(async () => {
      const next = await getConversation(activeId);
      if (!next) {
        setError("Conversation introuvable.");
        setActiveId(null);
        return;
      }
      setDetail(next);
      setConversations((prev) =>
        prev.map((c) => (c.id === next.id ? { ...c, unread: 0 } : c)),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per activeId change
  }, [activeId]);

  function openConversation(id: string) {
    setError(null);
    setDraft("");
    setSelectMode(false);
    setSelectedIds(new Set());
    setDetail(null);
    setActiveId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    );
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    const messages = detail?.id === activeId ? detail.messages : [];
    setSelectedIds(new Set(messages.map((m) => m.id)));
  }

  function onSend(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;

    const text = draft.trim();
    setDraft("");
    setError(null);

    startTransition(async () => {
      const result = await sendMessage(activeId, text);
      if (!result.ok) {
        setError(result.error);
        setDraft(text);
        return;
      }

      const message = result.message as ChatMessage;
      setDetail((prev) =>
        prev && prev.id === activeId
          ? {
              ...prev,
              preview: message.text,
              updatedLabel: "À l’instant",
              messages: [...prev.messages, message],
            }
          : prev,
      );
      setConversations((prev) => {
        const updated = prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                preview: message.text,
                updatedLabel: "À l’instant",
                unread: 0,
              }
            : c,
        );
        const current = updated.find((c) => c.id === activeId);
        if (!current) return updated;
        return [current, ...updated.filter((c) => c.id !== activeId)];
      });
    });
  }

  function onDeleteSelected() {
    if (!activeId || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    setError(null);
    startTransition(async () => {
      const result = await deleteMessages(activeId, ids);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDetail((prev) => {
        if (!prev || prev.id !== activeId) return prev;
        const messages = prev.messages.filter((m) => !ids.includes(m.id));
        const last = messages[messages.length - 1];
        return {
          ...prev,
          messages,
          preview: last?.text ?? "Nouvelle conversation",
          updatedLabel: last ? last.timeLabel : "À l’instant",
        };
      });
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const remaining =
            detail?.messages.filter((m) => !ids.includes(m.id)) ?? [];
          const last = remaining[remaining.length - 1];
          return {
            ...c,
            preview: last?.text ?? "Nouvelle conversation",
            updatedLabel: last ? "À l’instant" : c.updatedLabel,
          };
        }),
      );
      setSelectedIds(new Set());
      setSelectMode(false);
    });
  }

  function onClearAll() {
    if (!activeId) return;
    if (
      !window.confirm(
        "Effacer tous les messages de cette conversation ? Cette action est définitive pour les deux personnes.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await clearConversation(activeId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDetail((prev) =>
        prev && prev.id === activeId
          ? {
              ...prev,
              messages: [],
              preview: "Nouvelle conversation",
              updatedLabel: "À l’instant",
            }
          : prev,
      );
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                preview: "Nouvelle conversation",
                updatedLabel: "À l’instant",
              }
            : c,
        ),
      );
      setSelectedIds(new Set());
      setSelectMode(false);
    });
  }

  if (activeId) {
    const peerName = detail?.peerName ?? activeSummary?.peerName ?? "…";
    const peerField = detail?.peerField ?? activeSummary?.peerField ?? "";
    const peerAvatarUrl =
      detail?.peerAvatarUrl ?? activeSummary?.peerAvatarUrl;
    const messages = detail?.id === activeId ? detail.messages : [];
    const loading = !detail || detail.id !== activeId;

    return (
      <div className="flex min-h-[70vh] flex-col">
        <div className="animate-hero-rise border-b border-line pb-4">
          <button
            type="button"
            onClick={() => {
              setActiveId(null);
              setDetail(null);
              setDraft("");
              setError(null);
              setSelectMode(false);
              setSelectedIds(new Set());
            }}
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            ← Conversations
          </button>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={peerName} src={peerAvatarUrl} size="md" />
              <div className="min-w-0">
                <h1 className="font-display text-xl font-semibold text-ink">
                  {peerName}
                </h1>
                <p className="text-sm text-muted">{peerField}</p>
              </div>
            </div>
            {!loading && messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setSelectMode((v) => !v);
                  setSelectedIds(new Set());
                }}
                className="shrink-0 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                {selectMode ? "Annuler" : "Sélectionner"}
              </button>
            ) : null}
          </div>
          {selectMode ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-semibold text-accent"
              >
                Tout sélectionner
              </button>
              <button
                type="button"
                disabled={selectedIds.size === 0 || isPending}
                onClick={onDeleteSelected}
                className="inline-flex h-9 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-50"
              >
                Supprimer ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={onClearAll}
                className="inline-flex h-9 items-center rounded-lg border border-line bg-surface px-3 text-xs font-semibold text-ink disabled:opacity-50"
              >
                Tout effacer
              </button>
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="animate-hero-rise-delay flex-1 space-y-3 overflow-y-auto py-6">
          {loading ? (
            <li className="py-8 text-center text-sm text-muted">
              Chargement…
            </li>
          ) : null}
          {!loading && messages.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted">
              Dis bonjour — c’est le début de la conversation.
            </li>
          ) : null}
          {messages.map((message) => (
            <li
              key={message.id}
              className={`flex items-end gap-2 ${
                message.fromMe ? "justify-end" : "justify-start"
              }`}
            >
              {selectMode ? (
                <input
                  type="checkbox"
                  checked={selectedIds.has(message.id)}
                  onChange={() => toggleSelect(message.id)}
                  className="mb-3 size-4 shrink-0 accent-[var(--accent)]"
                  aria-label="Sélectionner le message"
                />
              ) : null}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.fromMe
                    ? "rounded-br-md bg-accent text-white"
                    : "rounded-bl-md border border-line bg-surface text-ink"
                }`}
              >
                <p className="text-[15px] leading-relaxed">{message.text}</p>
                <p
                  className={`mt-1.5 text-[11px] ${
                    message.fromMe ? "text-white/75" : "text-muted"
                  }`}
                >
                  {message.timeLabel}
                </p>
                {!message.fromMe && !selectMode ? (
                  <div className="mt-2">
                    <ReportButton
                      targetType="message"
                      targetId={message.id}
                      isMine={false}
                    />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {!selectMode ? (
          <form
            onSubmit={onSend}
            className="sticky bottom-0 flex gap-2 border-t border-line bg-background pt-4 pb-2"
          >
            <label htmlFor="draft" className="sr-only">
              Message
            </label>
            <input
              id="draft"
              className={fieldClass}
              placeholder="Écrire un message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoComplete="off"
              disabled={isPending && !detail}
            />
            <button
              type="submit"
              disabled={!draft.trim() || isPending}
              className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,opacity,transform] hover:bg-accent-hover hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              Envoyer
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Messages
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
          Discute en privé avec un résident, sans donner ton numéro ni ton
          Instagram.
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="animate-hero-rise-delay mt-8 divide-y divide-line border-y border-line">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <button
              type="button"
              onClick={() => openConversation(conversation.id)}
              className="flex w-full gap-4 py-5 text-left transition-colors hover:bg-wash/60"
            >
              <Avatar
                name={conversation.peerName}
                src={conversation.peerAvatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="truncate font-display text-lg font-semibold text-ink">
                    {conversation.peerName}
                  </h2>
                  <span className="shrink-0 text-xs text-muted">
                    {conversation.updatedLabel}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {conversation.peerField}
                </p>
                <p className="mt-2 truncate text-sm text-muted">
                  {conversation.preview}
                </p>
              </div>
              {conversation.unread > 0 ? (
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent text-xs font-semibold text-white">
                  {conversation.unread}
                </span>
              ) : null}
            </button>
          </li>
        ))}
        {conversations.length === 0 ? (
          <li className="py-10 text-center text-sm text-muted">
            Aucune conversation. Contacte quelqu’un depuis un event, un SOS ou
            la recyclerie.
          </li>
        ) : null}
      </ul>

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Pour démarrer : Contacter depuis un event, un SOS, la recyclerie, ou
        l’annuaire Résidents.
      </p>
    </div>
  );
}
