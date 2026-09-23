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
  createMarketItem,
  markMarketGone,
  toggleMarketInterest,
  type MarketItem,
} from "@/lib/actions/marketplace";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

type CreateForm = {
  title: string;
  description: string;
  type: "don" | "vente";
  priceLabel: string;
  location: string;
};

const EMPTY_FORM: CreateForm = {
  title: "",
  description: "",
  type: "don",
  priceLabel: "",
  location: "",
};

function typeLabel(type: MarketItem["type"]) {
  return type === "don" ? "Don" : "Vente";
}

function statusLabel(status: MarketItem["status"]) {
  switch (status) {
    case "available":
      return "Disponible";
    case "reserved":
      return "Réservé";
    case "gone":
      return "Parti";
  }
}

function statusClass(status: MarketItem["status"]) {
  switch (status) {
    case "available":
      return "text-accent";
    case "reserved":
      return "text-[#9a4b1a]";
    case "gone":
      return "text-muted";
  }
}

export function MarketplaceBoard({
  initialItems,
  readOnly = false,
}: {
  initialItems: MarketItem[];
  readOnly?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<"all" | "don" | "vente">("all");
  const [mode, setMode] = useState<"list" | "create">("list");
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateForm, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showGone, setShowGone] = useState(false);
  const [scope, setScope] = useState<BoardScope>("all");
  const [isPending, startTransition] = useTransition();

  const scopedItems = useMemo(
    () => (scope === "mine" ? items.filter((item) => item.isMine) : items),
    [items, scope],
  );

  const activeItems = useMemo(
    () =>
      scopedItems.filter((item) => {
        if (item.status === "gone") return false;
        if (filter === "all") return true;
        return item.type === filter;
      }),
    [scopedItems, filter],
  );

  const goneItems = useMemo(
    () => scopedItems.filter((item) => item.status === "gone"),
    [scopedItems],
  );

  const mineCount = useMemo(
    () => items.filter((item) => item.isMine).length,
    [items],
  );
  const {
    visible: visibleActive,
    hasMore: hasMoreActive,
    remaining: remainingActive,
    showMore: showMoreActive,
  } = useLoadMore(activeItems, 8);

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function replaceItem(item: MarketItem) {
    setItems((prev) => prev.map((row) => (row.id === item.id ? item : row)));
  }

  function onToggleInterest(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await toggleMarketInterest(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) replaceItem(result.item);
    });
  }

  function onMarkGone(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await markMarketGone(id);
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

    if (!form.title.trim()) next.title = "Donne un titre à l’annonce.";
    if (!form.description.trim()) {
      next.description = "Ajoute une courte description.";
    }
    if (!form.location.trim()) next.location = "Indique où récupérer l’objet.";
    if (form.type === "vente" && !form.priceLabel.trim()) {
      next.priceLabel = "Indique un prix (ex. 10 €).";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await createMarketItem(form);
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
            ← Retour à la recyclerie
          </button>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
            Publier une annonce
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            Donne ou vends un objet uniquement aux résidents de ton bâtiment.
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="animate-hero-rise-delay mt-8 space-y-5"
          noValidate
        >
          <fieldset>
            <legend className={labelClass}>Type</legend>
            <div className="mt-2 flex gap-2">
              {(["don", "vente"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("type", type)}
                  className={`inline-flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition-colors ${
                    form.type === type
                      ? "border-accent bg-accent/5 text-accent"
                      : "border-line bg-surface text-ink hover:bg-wash"
                  }`}
                >
                  {typeLabel(type)}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="title" className={labelClass}>
              Titre
            </label>
            <input
              id="title"
              className={fieldClass}
              placeholder="Ex. Micro-ondes à donner"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            {errors.title ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.title}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className={labelClass}>
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              className={`${fieldClass} resize-y`}
              placeholder="État, détails utiles…"
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
              <p className="mt-1.5 text-sm text-red-700">{errors.description}</p>
            ) : null}
          </div>

          {form.type === "vente" ? (
            <div>
              <label htmlFor="priceLabel" className={labelClass}>
                Prix
              </label>
              <input
                id="priceLabel"
                className={fieldClass}
                placeholder="Ex. 15 €"
                value={form.priceLabel}
                onChange={(e) => update("priceLabel", e.target.value)}
              />
              {errors.priceLabel ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.priceLabel}</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label htmlFor="location" className={labelClass}>
              Lieu de récupération
            </label>
            <input
              id="location"
              className={fieldClass}
              placeholder="Ex. Hall A, salle commune…"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
            {errors.location ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.location}</p>
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
            {isPending ? "Publication…" : "Publier"}
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
            Recyclerie
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            {readOnly
              ? "Dons et ventes des résidents — consultation seule."
              : "Dons et petites ventes entre résidents — sans livraisons, sans inconnus hors immeuble."}
          </p>
        </div>
        {!readOnly ? (
        <button
          type="button"
          onClick={() => setMode("create")}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Publier
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
          allCount={items.length}
          mineCount={mineCount}
        />
      </div>
      ) : null}

      <div className={`${readOnly ? "mt-8" : "mt-4"} flex gap-2`}>
        {(
          [
            { id: "all", label: "Tout" },
            { id: "don", label: "Dons" },
            { id: "vente", label: "Ventes" },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFilter(option.id)}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
              filter === option.id
                ? "border-accent bg-accent/5 text-accent"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Annonces · {activeItems.length}
        </h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {visibleActive.map((item) => (
            <MarketRow
              key={item.id}
              item={item}
              busy={isPending}
              readOnly={readOnly}
              onInterest={
                readOnly ? undefined : () => onToggleInterest(item.id)
              }
              onMarkGone={readOnly ? undefined : () => onMarkGone(item.id)}
            />
          ))}
          {activeItems.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              {readOnly
                ? "Aucune annonce pour ce filtre."
                : scope === "mine"
                  ? "Tu n’as aucune annonce active pour ce filtre."
                  : "Aucune annonce pour ce filtre. Publie la première !"}
            </li>
          ) : null}
        </ul>
        {hasMoreActive ? (
          <LoadMoreButton remaining={remainingActive} onClick={showMoreActive} />
        ) : null}
      </section>

      {goneItems.length > 0 ? (
        <section className="mt-12">
          <button
            type="button"
            onClick={() => setShowGone((v) => !v)}
            className="font-display text-sm font-semibold tracking-wide text-muted transition-colors hover:text-ink"
          >
            {showGone ? "Masquer" : "Voir"} les partis · {goneItems.length}
          </button>
          {showGone ? (
            <ul className="mt-2 divide-y divide-line border-y border-line opacity-75">
              {goneItems.map((item) => (
                <MarketRow key={item.id} item={item} readOnly={readOnly} />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MarketRow({
  item,
  busy,
  onInterest,
  onMarkGone,
  readOnly = false,
}: {
  item: MarketItem;
  busy?: boolean;
  onInterest?: () => void;
  onMarkGone?: () => void;
  readOnly?: boolean;
}) {
  const isGone = item.status === "gone";

  return (
    <li className="py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs font-semibold text-[#1d4f7a]">
          {typeLabel(item.type)}
        </p>
        <p className={`text-xs font-semibold ${statusClass(item.status)}`}>
          {statusLabel(item.status)}
        </p>
        {item.priceLabel ? (
          <p className="text-xs font-semibold text-ink">{item.priceLabel}</p>
        ) : null}
      </div>
      <h3 className="mt-2 font-display text-lg font-semibold text-ink">
        {item.title}
      </h3>
      <p className="mt-2 text-base leading-relaxed text-muted">{item.description}</p>
      <p className="mt-3 text-sm text-ink">
        {item.location}
        <span className="font-normal text-muted">
          {" "}
          · {item.author} · {item.timeLabel}
          {item.interests > 0
            ? ` · ${item.interests} intéressé${item.interests > 1 ? "s" : ""}`
            : ""}
        </span>
      </p>

      {!isGone && !readOnly ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {!item.isMine && onInterest ? (
            <button
              type="button"
              disabled={busy}
              onClick={onInterest}
              className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-[background-color,border-color,transform,opacity] disabled:opacity-60 ${
                item.iInterested
                  ? "border border-line bg-wash text-ink hover:bg-surface"
                  : "bg-ink text-white hover:opacity-90 hover:-translate-y-0.5"
              }`}
            >
              {item.iInterested ? "Retirer mon intérêt" : "Je suis intéressé"}
            </button>
          ) : null}
          <ContactAuthorLink authorId={item.authorId} isMine={item.isMine} />
          {item.isMine && onMarkGone ? (
            <button
              type="button"
              disabled={busy}
              onClick={onMarkGone}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
            >
              Marquer comme parti
            </button>
          ) : null}
        </div>
      ) : null}
      {!readOnly ? (
      <div className="mt-3">
        <ReportButton
          targetType="recyclerie"
          targetId={item.id}
          isMine={item.isMine}
        />
      </div>
      ) : null}
    </li>
  );
}
