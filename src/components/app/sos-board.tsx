"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { ContactAuthorLink } from "@/components/app/contact-author-link";
import { ReportButton } from "@/components/app/report-button";
import {
  BoardScopeFilter,
  type BoardScope,
} from "@/components/ui/board-scope-filter";
import { EmojiPickerButton } from "@/components/ui/emoji-picker";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";
import {
  createSos,
  prolongSos,
  resolveSos,
  toggleSosHelp,
  type SosItem,
} from "@/lib/actions/sos";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

type CreateForm = {
  title: string;
  description: string;
};

const EMPTY_FORM: CreateForm = {
  title: "",
  description: "",
};

function isActiveStatus(status: SosItem["status"]) {
  return status === "open" || status === "helped";
}

function statusLabel(status: SosItem["status"]) {
  switch (status) {
    case "open":
      return "Ouvert";
    case "helped":
      return "Quelqu’un aide";
    case "closed":
      return "Résolu";
    case "expired":
      return "Expiré";
  }
}

function statusClass(status: SosItem["status"]) {
  switch (status) {
    case "open":
      return "text-[#9a4b1a]";
    case "helped":
      return "text-accent";
    case "closed":
    case "expired":
      return "text-muted";
  }
}

export function SosBoard({
  initialItems,
  readOnly = false,
}: {
  initialItems: SosItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateForm, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [scope, setScope] = useState<BoardScope>("all");
  const [isPending, startTransition] = useTransition();

  const scopedItems = useMemo(
    () => (scope === "mine" ? items.filter((item) => item.isMine) : items),
    [items, scope],
  );
  const openItems = useMemo(
    () => scopedItems.filter((item) => isActiveStatus(item.status)),
    [scopedItems],
  );
  const closedItems = useMemo(
    () => scopedItems.filter((item) => item.status === "closed"),
    [scopedItems],
  );
  const expiredItems = useMemo(
    () => scopedItems.filter((item) => item.status === "expired"),
    [scopedItems],
  );
  const openAllCount = useMemo(
    () => items.filter((item) => isActiveStatus(item.status)).length,
    [items],
  );
  const mineCount = useMemo(
    () =>
      items.filter((item) => item.isMine && isActiveStatus(item.status)).length,
    [items],
  );
  const {
    visible: visibleOpen,
    hasMore: hasMoreOpen,
    remaining: remainingOpen,
    showMore: showMoreOpen,
  } = useLoadMore(openItems, 8);

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function replaceItem(item: SosItem) {
    setItems((prev) => prev.map((row) => (row.id === item.id ? item : row)));
  }

  function onToggleHelp(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await toggleSosHelp(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) replaceItem(result.item);
    });
  }

  function onResolve(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await resolveSos(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) replaceItem(result.item);
    });
  }

  function onProlong(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await prolongSos(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) replaceItem(result.item);
    });
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof CreateForm, string>> = {};
    if (!form.title.trim()) next.title = "Décris le besoin en une phrase.";
    if (!form.description.trim()) {
      next.description = "Ajoute un détail pour que quelqu’un puisse t’aider.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await createSos(form);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) {
        setItems((prev) => [result.item!, ...prev]);
      }
      setForm(EMPTY_FORM);
      setMode("list");
    });
  }

  if (mode === "create" && !readOnly) {
    return (
      <div>
        <div className="animate-hero-rise">
          <button
            type="button"
            onClick={() => setMode("list")}
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            ← Retour aux SOS
          </button>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
            Lancer un SOS
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            Un besoin court et urgent, visible uniquement dans ta résidence.
          </p>
          <p className="mt-4 max-w-lg rounded-lg border border-line bg-wash px-4 py-3 text-sm leading-relaxed text-muted">
            Visible <span className="font-medium text-ink">7 jours</span>. Tu
            peux le marquer résolu à tout moment, ou le prolonger une fois (+7
            j.). Passé ce délai, il passe en « expiré » (plus en cours). Max 2
            SOS ouverts.
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="animate-hero-rise-delay mt-8 space-y-5"
          noValidate
        >
          <div>
            <label htmlFor="title" className={labelClass}>
              Besoin
            </label>
            <input
              id="title"
              className={fieldClass}
              placeholder="Ex. Quelqu’un a un chargeur USB-C ?"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            {errors.title ? (
              <p className="mt-1.5 text-sm text-red-700" role="alert">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Détail
            </label>
            <textarea
              id="description"
              rows={3}
              className={`${fieldClass} resize-y`}
              placeholder="Précise le contexte, l’urgence…"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            <div className="mt-2">
              <EmojiPickerButton
                disabled={isPending}
                onPick={(emoji) =>
                  update("description", form.description + emoji)
                }
              />
            </div>
            {errors.description ? (
              <p className="mt-1.5 text-sm text-red-700" role="alert">
                {errors.description}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="text-sm text-red-700" role="alert">
              {formError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60 sm:w-auto"
          >
            {isPending ? "Publication…" : "Publier le SOS"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-hero-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            SOS
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            {readOnly
              ? "Entraide flash des résidents — consultation seule."
              : "Entraide flash entre voisins : un objet, un coup de main, une question urgente."}
          </p>
        </div>
        {!readOnly ? (
          <button
            type="button"
            onClick={() => setMode("create")}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
          >
            Lancer un SOS
          </button>
        ) : null}
      </div>

      {formError ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      {!readOnly ? (
        <div className="animate-hero-rise-delay mt-8">
          <BoardScopeFilter
            value={scope}
            onChange={setScope}
            allCount={openAllCount}
            mineCount={mineCount}
          />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          En cours · {openItems.length}
        </h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {visibleOpen.map((item) => (
            <SosRow
              key={item.id}
              item={item}
              busy={isPending}
              onHelp={readOnly ? undefined : () => onToggleHelp(item.id)}
              onResolve={readOnly ? undefined : () => onResolve(item.id)}
              onProlong={readOnly ? undefined : () => onProlong(item.id)}
              readOnly={readOnly}
            />
          ))}
          {openItems.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              {readOnly
                ? "Aucun SOS ouvert pour le moment."
                : scope === "mine"
                  ? "Tu n’as aucun SOS en cours."
                  : "Aucun SOS ouvert. Tout va bien — ou lance le tien."}
            </li>
          ) : null}
        </ul>
        {hasMoreOpen ? (
          <LoadMoreButton remaining={remainingOpen} onClick={showMoreOpen} />
        ) : null}
      </section>

      {closedItems.length > 0 ? (
        <section className="mt-12">
          <button
            type="button"
            onClick={() => setShowClosed((v) => !v)}
            className="font-display text-sm font-semibold tracking-wide text-muted transition-colors hover:text-ink"
          >
            {showClosed ? "Masquer" : "Voir"} les résolus · {closedItems.length}
          </button>
          {showClosed ? (
            <ul className="mt-2 divide-y divide-line border-y border-line opacity-75">
              {closedItems.map((item) => (
                <SosRow key={item.id} item={item} />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {expiredItems.length > 0 ? (
        <section className="mt-8">
          <button
            type="button"
            onClick={() => setShowExpired((v) => !v)}
            className="font-display text-sm font-semibold tracking-wide text-muted transition-colors hover:text-ink"
          >
            {showExpired ? "Masquer" : "Voir"} les expirés ·{" "}
            {expiredItems.length}
          </button>
          {showExpired ? (
            <ul className="mt-2 divide-y divide-line border-y border-line opacity-75">
              {expiredItems.map((item) => (
                <SosRow
                  key={item.id}
                  item={item}
                  busy={isPending}
                  onResolve={readOnly ? undefined : () => onResolve(item.id)}
                  onProlong={readOnly ? undefined : () => onProlong(item.id)}
                  readOnly={readOnly}
                />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function SosRow({
  item,
  busy,
  onHelp,
  onResolve,
  onProlong,
  readOnly = false,
}: {
  item: SosItem;
  busy?: boolean;
  onHelp?: () => void;
  onResolve?: () => void;
  onProlong?: () => void;
  readOnly?: boolean;
}) {
  const active = isActiveStatus(item.status);
  const expired = item.status === "expired";
  const showAuthorActions =
    !readOnly && item.isMine && (active || expired);

  return (
    <li className="py-6">
      <p className={`text-xs font-semibold ${statusClass(item.status)}`}>
        {statusLabel(item.status)}
      </p>
      <h3 className="mt-2 font-display text-lg font-semibold text-ink">
        {item.title}
      </h3>
      <p className="mt-2 text-base leading-relaxed text-muted">{item.description}</p>
      <p className="mt-3 text-xs text-muted">
        {item.author} · {item.timeLabel}
        {active ? ` · ${item.expiresLabel}` : ""}
        {item.helpers > 0
          ? ` · ${item.helpers} aide${item.helpers > 1 ? "s" : ""}`
          : ""}
      </p>

      {(active || expired) && !readOnly ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {active && !item.isMine && onHelp ? (
            <button
              type="button"
              disabled={busy}
              onClick={onHelp}
              className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-[background-color,border-color,transform,opacity] disabled:opacity-60 ${
                item.iHelped
                  ? "border border-line bg-wash text-ink hover:bg-surface"
                  : "bg-ink text-white hover:opacity-90 hover:-translate-y-0.5"
              }`}
            >
              {item.iHelped ? "Retirer mon aide" : "Je peux aider"}
            </button>
          ) : null}
          {active ? (
            <ContactAuthorLink authorId={item.authorId} isMine={item.isMine} />
          ) : null}
          {showAuthorActions && onResolve ? (
            <button
              type="button"
              disabled={busy}
              onClick={onResolve}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
            >
              Marquer résolu
            </button>
          ) : null}
          {showAuthorActions && item.canProlong && onProlong ? (
            <button
              type="button"
              disabled={busy}
              onClick={onProlong}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
            >
              Prolonger (+7 j.)
            </button>
          ) : null}
        </div>
      ) : null}
      {!readOnly ? (
        <div className="mt-3">
          <ReportButton
            targetType="sos"
            targetId={item.id}
            isMine={item.isMine}
          />
        </div>
      ) : null}
    </li>
  );
}
