"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { ContactAuthorLink } from "@/components/app/contact-author-link";
import { ReportButton } from "@/components/app/report-button";
import {
  createSos,
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

function statusLabel(status: SosItem["status"]) {
  switch (status) {
    case "open":
      return "Ouvert";
    case "helped":
      return "Quelqu’un aide";
    case "closed":
      return "Résolu";
  }
}

function statusClass(status: SosItem["status"]) {
  switch (status) {
    case "open":
      return "text-[#9a4b1a]";
    case "helped":
      return "text-accent";
    case "closed":
      return "text-muted";
  }
}

export function SosBoard({ initialItems }: { initialItems: SosItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateForm, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [isPending, startTransition] = useTransition();

  const openItems = useMemo(
    () => items.filter((item) => item.status !== "closed"),
    [items],
  );
  const closedItems = useMemo(
    () => items.filter((item) => item.status === "closed"),
    [items],
  );

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

  if (mode === "create") {
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
              <p className="mt-1.5 text-sm text-red-700">{errors.title}</p>
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
            {errors.description ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.description}</p>
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
            Entraide flash entre voisins : un objet, un coup de main, une
            question urgente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMode("create")}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Lancer un SOS
        </button>
      </div>

      {formError ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {formError}
        </p>
      ) : null}

      <section className="animate-hero-rise-delay mt-10">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          En cours · {openItems.length}
        </h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {openItems.map((item) => (
            <SosRow
              key={item.id}
              item={item}
              busy={isPending}
              onHelp={() => onToggleHelp(item.id)}
              onResolve={() => onResolve(item.id)}
            />
          ))}
          {openItems.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              Aucun SOS ouvert. Tout va bien — ou lance le tien.
            </li>
          ) : null}
        </ul>
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
    </div>
  );
}

function SosRow({
  item,
  busy,
  onHelp,
  onResolve,
}: {
  item: SosItem;
  busy?: boolean;
  onHelp?: () => void;
  onResolve?: () => void;
}) {
  const isClosed = item.status === "closed";

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
        {item.helpers > 0
          ? ` · ${item.helpers} aide${item.helpers > 1 ? "s" : ""}`
          : ""}
      </p>

      {!isClosed ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {!item.isMine && onHelp ? (
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
          <ContactAuthorLink authorId={item.authorId} isMine={item.isMine} />
          {item.isMine && onResolve ? (
            <button
              type="button"
              disabled={busy}
              onClick={onResolve}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
            >
              Marquer résolu
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3">
        <ReportButton
          targetType="sos"
          targetId={item.id}
          isMine={item.isMine}
        />
      </div>
    </li>
  );
}
