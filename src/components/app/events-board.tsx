"use client";

import { useEffect, useMemo, useState, useTransition, type FormEvent } from "react";
import { ContactAuthorLink } from "@/components/app/contact-author-link";
import { ReportButton } from "@/components/app/report-button";
import {
  BoardScopeFilter,
  type BoardScope,
} from "@/components/ui/board-scope-filter";
import { EmojiPickerButton } from "@/components/ui/emoji-picker";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";
import {
  cancelEvent,
  createEvent,
  toggleEventJoin,
  updateEventSpots,
  type EventItem,
} from "@/lib/actions/events";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const labelClass = "block text-sm font-medium text-ink";

type CreateForm = {
  title: string;
  description: string;
  whenLabel: string;
  where: string;
  spotsTotal: string;
};

const EMPTY_FORM: CreateForm = {
  title: "",
  description: "",
  whenLabel: "",
  where: "",
  spotsTotal: "4",
};

export function EventsBoard({
  initialEvents,
  readOnly = false,
}: {
  initialEvents: EventItem[];
  readOnly?: boolean;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [mode, setMode] = useState<"list" | "create">("list");
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateForm, string>>>(
    {},
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [showFull, setShowFull] = useState(false);
  const [scope, setScope] = useState<BoardScope>("all");
  const [isPending, startTransition] = useTransition();

  const scopedEvents = useMemo(
    () =>
      scope === "mine" ? events.filter((event) => event.isMine) : events,
    [events, scope],
  );
  const openEvents = useMemo(
    () => scopedEvents.filter((event) => event.spotsTaken < event.spotsTotal),
    [scopedEvents],
  );
  const fullEvents = useMemo(
    () => scopedEvents.filter((event) => event.spotsTaken >= event.spotsTotal),
    [scopedEvents],
  );
  const mineCount = useMemo(
    () => events.filter((event) => event.isMine).length,
    [events],
  );
  const {
    visible: visibleOpen,
    hasMore: hasMoreOpen,
    remaining: remainingOpen,
    showMore: showMoreOpen,
  } = useLoadMore(openEvents, 8);

  function update<K extends keyof CreateForm>(key: K, value: CreateForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError(null);
  }

  function onToggleJoin(id: string) {
    setFormError(null);
    startTransition(async () => {
      const result = await toggleEventJoin(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) {
        setEvents((prev) =>
          prev.map((event) => (event.id === id ? result.item! : event)),
        );
      }
    });
  }

  function onCancel(id: string) {
    if (
      !window.confirm(
        "Retirer cet événement ? Il disparaîtra de la liste pour tout le monde.",
      )
    ) {
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const result = await cancelEvent(id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setEvents((prev) => prev.filter((event) => event.id !== id));
    });
  }

  function onUpdateSpots(id: string, spotsTotal: number) {
    setFormError(null);
    startTransition(async () => {
      const result = await updateEventSpots(id, spotsTotal);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) {
        setEvents((prev) =>
          prev.map((event) => (event.id === id ? result.item! : event)),
        );
      }
    });
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const next: Partial<Record<keyof CreateForm, string>> = {};
    const spots = Number(form.spotsTotal);

    if (!form.title.trim()) next.title = "Donne un titre court.";
    if (!form.description.trim()) {
      next.description = "Ajoute une petite description.";
    }
    if (!form.whenLabel.trim()) {
      next.whenLabel = "Indique quand (ex. Ce soir · 20h).";
    }
    if (!form.where.trim()) next.where = "Indique où ça se passe.";
    if (!Number.isFinite(spots) || spots < 2 || spots > 30) {
      next.spotsTotal = "Entre 2 et 30 places.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    startTransition(async () => {
      const result = await createEvent({
        title: form.title,
        description: form.description,
        whenLabel: form.whenLabel,
        where: form.where,
        spotsTotal: spots,
      });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      if (result.item) {
        setEvents((prev) => [result.item!, ...prev]);
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
            ← Retour aux événements
          </button>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">
            Proposer une activité
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            Un micro-événement visible uniquement dans ta résidence.
          </p>
        </div>

        <form
          onSubmit={onCreate}
          className="animate-hero-rise-delay mt-8 space-y-5"
          noValidate
        >
          <div>
            <label htmlFor="title" className={labelClass}>
              Titre
            </label>
            <input
              id="title"
              className={fieldClass}
              placeholder="Ex. Tournoi FIFA chambre 302"
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
              placeholder="Ambiance, niveau, ce qu’il faut apporter…"
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="whenLabel" className={labelClass}>
                Quand
              </label>
              <input
                id="whenLabel"
                className={fieldClass}
                placeholder="Ex. Ce soir · 20h"
                value={form.whenLabel}
                onChange={(e) => update("whenLabel", e.target.value)}
              />
              {errors.whenLabel ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.whenLabel}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="spotsTotal" className={labelClass}>
                Places
              </label>
              <input
                id="spotsTotal"
                type="number"
                min={2}
                max={30}
                className={fieldClass}
                value={form.spotsTotal}
                onChange={(e) => update("spotsTotal", e.target.value)}
              />
              {errors.spotsTotal ? (
                <p className="mt-1.5 text-sm text-red-700">{errors.spotsTotal}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="where" className={labelClass}>
              Où
            </label>
            <input
              id="where"
              className={fieldClass}
              placeholder="Ex. Salle commune, hall A…"
              value={form.where}
              onChange={(e) => update("where", e.target.value)}
            />
            {errors.where ? (
              <p className="mt-1.5 text-sm text-red-700">{errors.where}</p>
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
            {isPending ? "Publication…" : "Publier l’événement"}
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
            Événements
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
            {readOnly
              ? "Activités proposées par les résidents — consultation seule."
              : "FIFA, sorties, révisions… propose ou rejoins une activité dans ta résidence."}
          </p>
        </div>
        {!readOnly ? (
        <button
          type="button"
          onClick={() => setMode("create")}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Proposer
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
          allCount={events.length}
          mineCount={mineCount}
        />
      </div>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">
          Places disponibles · {openEvents.length}
        </h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {visibleOpen.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              busy={isPending}
              readOnly={readOnly}
              onToggle={() => onToggleJoin(event.id)}
              onCancel={() => onCancel(event.id)}
              onUpdateSpots={(spots) => onUpdateSpots(event.id, spots)}
            />
          ))}
          {openEvents.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted">
              {readOnly
                ? "Aucun événement ouvert pour le moment."
                : scope === "mine"
                  ? "Tu n’as aucun événement ouvert. Propose-en un !"
                  : "Aucune place ouverte pour le moment. Propose quelque chose !"}
            </li>
          ) : null}
        </ul>
        {hasMoreOpen ? (
          <LoadMoreButton remaining={remainingOpen} onClick={showMoreOpen} />
        ) : null}
      </section>

      {fullEvents.length > 0 ? (
        <section className="mt-12">
          <button
            type="button"
            onClick={() => setShowFull((v) => !v)}
            className="font-display text-sm font-semibold tracking-wide text-muted transition-colors hover:text-ink"
          >
            {showFull ? "Masquer" : "Voir"} les complets · {fullEvents.length}
          </button>
          {showFull ? (
            <ul className="mt-2 divide-y divide-line border-y border-line opacity-80">
              {fullEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  busy={isPending}
                  readOnly={readOnly}
                  onToggle={() => onToggleJoin(event.id)}
                  onCancel={() => onCancel(event.id)}
                  onUpdateSpots={(spots) => onUpdateSpots(event.id, spots)}
                />
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function EventRow({
  event,
  busy,
  onToggle,
  onCancel,
  onUpdateSpots,
  readOnly = false,
}: {
  event: EventItem;
  busy: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onUpdateSpots: (spotsTotal: number) => void;
  readOnly?: boolean;
}) {
  const remaining = event.spotsTotal - event.spotsTaken;
  const isFull = remaining <= 0;
  const [spotsDraft, setSpotsDraft] = useState(String(event.spotsTotal));
  const [editingSpots, setEditingSpots] = useState(false);

  useEffect(() => {
    setSpotsDraft(String(event.spotsTotal));
  }, [event.spotsTotal]);

  const minSpots = Math.max(2, event.spotsTaken);

  function saveSpots() {
    const spots = Number(spotsDraft);
    if (!Number.isFinite(spots) || spots < minSpots || spots > 30) {
      setSpotsDraft(String(event.spotsTotal));
      setEditingSpots(false);
      return;
    }
    if (spots === event.spotsTotal) {
      setEditingSpots(false);
      return;
    }
    onUpdateSpots(spots);
    setEditingSpots(false);
  }

  return (
    <li className="py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-ink">
            {event.title}
          </h3>
          <p className="mt-2 text-base leading-relaxed text-muted">
            {event.description}
          </p>
          <p className="mt-3 text-sm font-medium text-ink">
            {event.whenLabel}
            <span className="font-normal text-muted"> · {event.where}</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            Par {event.author} · {event.spotsTaken}/{event.spotsTotal} inscrits
            {!isFull ? ` · ${remaining} place${remaining > 1 ? "s" : ""}` : ""}
          </p>
          {!readOnly && event.isMine ? (
            <div className="mt-3">
              {editingSpots ? (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-ink" htmlFor={`spots-${event.id}`}>
                    Places totales
                  </label>
                  <input
                    id={`spots-${event.id}`}
                    type="number"
                    min={minSpots}
                    max={30}
                    value={spotsDraft}
                    onChange={(e) => setSpotsDraft(e.target.value)}
                    className="h-9 w-20 rounded-lg border border-line bg-surface px-2 text-sm text-ink"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={saveSpots}
                    className="inline-flex h-9 items-center rounded-lg bg-ink px-3 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSpotsDraft(String(event.spotsTotal));
                      setEditingSpots(false);
                    }}
                    className="text-xs font-medium text-muted hover:text-ink"
                  >
                    Annuler
                  </button>
                  <span className="text-[11px] text-muted">
                    Min. {minSpots} (inscrits)
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setSpotsDraft(String(event.spotsTotal));
                    setEditingSpots(true);
                  }}
                  className="text-xs font-semibold text-accent hover:underline disabled:opacity-60"
                >
                  Modifier les places
                </button>
              )}
            </div>
          ) : null}
        </div>

        {!readOnly ? (
        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
          <button
            type="button"
            disabled={busy || (isFull && !event.joined)}
            onClick={onToggle}
            className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition-[background-color,border-color,opacity,transform] disabled:opacity-60 ${
              event.joined
                ? "border border-line bg-wash text-ink hover:bg-surface"
                : isFull
                  ? "cursor-not-allowed border border-line bg-wash text-muted"
                  : "bg-ink text-white hover:opacity-90 hover:-translate-y-0.5"
            }`}
          >
            {event.joined
              ? "Se désinscrire"
              : isFull
                ? "Complet"
                : "Je participe"}
          </button>
          {event.isMine ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
            >
              Retirer
            </button>
          ) : (
            <ContactAuthorLink authorId={event.authorId} isMine={false} />
          )}
        </div>
        ) : null}
      </div>
      {!readOnly ? (
      <div className="mt-3">
        <ReportButton
          targetType="event"
          targetId={event.id}
          isMine={event.isMine}
        />
      </div>
      ) : null}
    </li>
  );
}
