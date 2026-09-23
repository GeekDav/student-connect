"use client";

import { useMemo, useState } from "react";
import { ContactAuthorLink } from "@/components/app/contact-author-link";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";
import type { DirectoryResident } from "@/lib/actions/residents";

const selectClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const inputClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, "fr"));
}

export function ResidentsDirectory({
  initialResidents,
  readOnly = false,
}: {
  initialResidents: DirectoryResident[];
  readOnly?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [field, setField] = useState("");
  const [interest, setInterest] = useState("");
  const [nationality, setNationality] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  const fields = useMemo(
    () =>
      uniqueSorted(
        initialResidents
          .map((r) => r.fieldOfStudy)
          .filter((value) => value && value !== "—"),
      ),
    [initialResidents],
  );
  const interests = useMemo(
    () => uniqueSorted(initialResidents.flatMap((r) => r.interests)),
    [initialResidents],
  );
  const nationalities = useMemo(
    () =>
      uniqueSorted(
        initialResidents
          .map((r) => r.nationality)
          .filter((value): value is string => Boolean(value)),
      ),
    [initialResidents],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return initialResidents.filter((resident) => {
      if (field && resident.fieldOfStudy !== field) return false;
      if (interest && !resident.interests.includes(interest)) return false;
      if (nationality && resident.nationality !== nationality) return false;
      if (availableOnly && !resident.isAvailable) return false;

      if (!q) return true;

      const haystack = [
        resident.firstName,
        resident.lastName,
        resident.school,
        resident.fieldOfStudy,
        resident.bio ?? "",
        ...(resident.nationality ? [resident.nationality] : []),
        ...resident.interests,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [initialResidents, search, field, interest, nationality, availableOnly]);

  const { visible, hasMore, remaining, showMore } = useLoadMore(filtered, 8);

  const activeFilters =
    [field, interest, nationality].filter(Boolean).length +
    (availableOnly ? 1 : 0);

  function resetFilters() {
    setSearch("");
    setField("");
    setInterest("");
    setNationality("");
    setAvailableOnly(false);
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Résidents
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted">
          Trouve un voisin de ta filière, de ta nationalité ou qui partage tes
          centres d’intérêt — uniquement dans ta résidence.
        </p>
      </div>

      <div className="animate-hero-rise-delay mt-8 space-y-4">
        <div>
          <label htmlFor="resident-search" className="text-sm font-medium text-ink">
            Rechercher
          </label>
          <input
            id="resident-search"
            className={inputClass}
            placeholder="Nom, école, passion…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="filter-field" className="text-sm font-medium text-ink">
              Domaine d’études
            </label>
            <select
              id="filter-field"
              className={selectClass}
              value={field}
              onChange={(e) => setField(e.target.value)}
            >
              <option value="">Tous</option>
              {fields.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-interest"
              className="text-sm font-medium text-ink"
            >
              Passion
            </label>
            <select
              id="filter-interest"
              className={selectClass}
              value={interest}
              onChange={(e) => setInterest(e.target.value)}
            >
              <option value="">Toutes</option>
              {interests.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-nationality"
              className="text-sm font-medium text-ink"
            >
              Nationalité
            </label>
            <select
              id="filter-nationality"
              className={selectClass}
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            >
              <option value="">Toutes</option>
              {nationalities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="size-4 rounded border-line accent-[var(--accent)]"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
          />
          Uniquement les dispo
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {filtered.length} résident{filtered.length > 1 ? "s" : ""}
            {activeFilters > 0 ? " · filtres actifs" : ""}
          </p>
          {search || activeFilters > 0 ? (
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-accent transition-opacity hover:opacity-70"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      <ul className="animate-hero-rise-delay-2 mt-6 divide-y divide-line border-y border-line">
        {visible.map((resident) => (
          <li
            key={resident.id}
            className="flex gap-4 py-5 transition-colors hover:bg-wash/40"
          >
            <Avatar
              name={`${resident.firstName} ${resident.lastName}`}
              src={resident.avatarUrl}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h2 className="font-display text-lg font-semibold text-ink">
                  {resident.firstName} {resident.lastName}
                  {resident.isMine ? (
                    <span className="ml-2 text-sm font-medium text-muted">
                      (toi)
                    </span>
                  ) : null}
                </h2>
                {resident.isAvailable ? (
                  <span className="text-xs font-semibold text-accent">
                    Dispo
                  </span>
                ) : null}
                {resident.nationality ? (
                  <span className="text-sm text-muted">{resident.nationality}</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-ink">
                {resident.fieldOfStudy}
                <span className="text-muted"> · {resident.school}</span>
              </p>
              {resident.bio ? (
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {resident.bio}
                </p>
              ) : null}
              {resident.interests.length > 0 ? (
                <p className="mt-2 text-xs text-muted">
                  {resident.interests.join(" · ")}
                </p>
              ) : null}
              <div className="mt-3">
                {!readOnly ? (
                <ContactAuthorLink
                  authorId={resident.id}
                  isMine={resident.isMine}
                  label="Envoyer un message"
                />
                ) : null}
              </div>
            </div>
          </li>
        ))}

        {filtered.length === 0 ? (
          <li className="border-0 py-6">
            <EmptyState
              title="Aucun résident trouvé"
              description={
                initialResidents.length === 0
                  ? "Pas encore d’autres résidents validés dans ta résidence."
                  : "Élargis ta recherche ou réinitialise les filtres."
              }
              action={
                initialResidents.length > 0 ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
                  >
                    Réinitialiser
                  </button>
                ) : null
              }
            />
          </li>
        ) : null}
      </ul>

      {hasMore ? (
        <LoadMoreButton remaining={remaining} onClick={showMore} />
      ) : null}

      <p className="mt-6 text-xs leading-relaxed text-muted">
        Les numéros de chambre ne sont jamais affichés ici. La nationalité
        n’apparaît que si la personne l’a choisie.
      </p>
    </div>
  );
}
