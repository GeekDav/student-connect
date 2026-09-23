"use client";

import { useMemo, useState, useTransition } from "react";
import {
  removeResident,
  type ResidenceMemberItem,
} from "@/lib/actions/manager-memberships";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadMoreButton, useLoadMore } from "@/components/ui/load-more";

const fieldClass =
  "mt-2 w-full rounded-lg border border-line bg-surface px-3.5 py-3 text-[15px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_rgba(12,107,92,0.12)]";

const REASONS = [
  "Fin de bail",
  "Déménagement",
  "Changement de résidence",
  "Autre",
] as const;

type StatusFilter = "active" | "left" | "all";

function csvEscape(value: string) {
  const v = value.replace(/"/g, '""');
  return `"${v}"`;
}

function downloadResidentsCsv(
  rows: ResidenceMemberItem[],
  filter: StatusFilter,
) {
  const header = [
    "prenom",
    "nom",
    "email",
    "chambre",
    "ecole",
    "domaine",
    "statut",
    "valide_le",
    "parti_le",
    "motif_depart",
  ];
  const lines = [
    header.join(","),
    ...rows.map((m) =>
      [
        m.firstName,
        m.lastName,
        m.email,
        m.roomNumber,
        m.school,
        m.fieldOfStudy,
        m.status === "active" ? "actif" : "parti",
        m.joinedAt,
        m.leftAt ?? "",
        m.leaveReason ?? "",
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `residents-${filter}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ManagerResidents({
  initialMembers,
}: {
  initialMembers: ResidenceMemberItem[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter === "active" && m.status !== "active") return false;
      if (statusFilter === "left" && m.status !== "left") return false;
      if (!q) return true;
      return `${m.firstName} ${m.lastName} ${m.email} ${m.roomNumber} ${m.fieldOfStudy} ${m.school}`
        .toLowerCase()
        .includes(q);
    });
  }, [members, query, statusFilter]);

  const {
    visible,
    hasMore,
    remaining,
    showMore,
  } = useLoadMore(filtered, 10);

  const confirming = members.find((m) => m.id === confirmId) ?? null;
  const activeCount = members.filter((m) => m.status === "active").length;
  const leftCount = members.filter((m) => m.status === "left").length;

  function confirmRemove() {
    if (!confirmId) return;
    setError(null);
    startTransition(async () => {
      const result = await removeResident(confirmId, reason);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMembers((prev) =>
        prev.map((m) =>
          m.id === confirmId
            ? {
                ...m,
                status: "left",
                leftAt: "À l’instant",
                leaveReason: reason,
              }
            : m,
        ),
      );
      setConfirmId(null);
      setReason(REASONS[0]);
    });
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Résidents
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Cherche, filtre, exporte ta liste. Retire un étudiant qui part : accès
          coupé tout de suite, compte conservé.
        </p>
      </div>

      {error ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="animate-hero-rise-delay mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <label htmlFor="member-search" className="text-sm font-medium text-ink">
            Rechercher
          </label>
          <input
            id="member-search"
            className={fieldClass}
            placeholder="Nom, chambre, e-mail, école…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={() => downloadResidentsCsv(filtered, statusFilter)}
          disabled={filtered.length === 0}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-50"
        >
          Exporter CSV ({filtered.length})
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            { id: "active", label: `Actifs · ${activeCount}` },
            { id: "left", label: `Partis · ${leftCount}` },
            { id: "all", label: `Tous · ${members.length}` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id)}
            className={`inline-flex h-10 items-center rounded-lg px-3.5 text-sm font-medium transition-colors ${
              statusFilter === tab.id
                ? "bg-accent text-white"
                : "border border-line bg-surface text-muted hover:bg-wash hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="mt-10">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Liste · {filtered.length}
        </h3>
        {filtered.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="Aucun résident pour ce filtre"
              description="Change le filtre ou la recherche, ou invite de nouveaux étudiants."
            />
          </div>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {visible.map((member) => (
                <li key={member.id} className="py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="font-display text-lg font-semibold text-ink">
                        {member.firstName} {member.lastName}
                      </h4>
                      <p className="mt-1 text-sm text-ink">
                        Chambre {member.roomNumber}
                        <span className="text-muted">
                          {" "}
                          · {member.fieldOfStudy}
                          {member.school !== "—" ? ` · ${member.school}` : ""}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">{member.email}</p>
                      <p className="mt-1 text-xs text-muted">
                        {member.status === "active"
                          ? `Validé le ${member.joinedAt}`
                          : `Parti${member.leftAt ? ` · ${member.leftAt}` : ""}${
                              member.leaveReason
                                ? ` · ${member.leaveReason}`
                                : ""
                            }`}
                      </p>
                    </div>
                    {member.status === "active" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => {
                          setConfirmId(member.id);
                          setReason(REASONS[0]);
                          setError(null);
                        }}
                        className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
                      >
                        Retirer de la résidence
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-muted">Parti</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {hasMore ? (
              <LoadMoreButton remaining={remaining} onClick={showMore} />
            ) : null}
          </>
        )}
      </section>

      {confirming ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[#0b161d]/45 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lg">
            <h3
              id="remove-title"
              className="font-display text-xl font-semibold text-ink"
            >
              Retirer {confirming.firstName} {confirming.lastName} ?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Accès coupé immédiatement à cette résidence. Le compte n’est pas
              supprimé définitivement.
            </p>
            <label
              htmlFor="leave-reason"
              className="mt-5 block text-sm font-medium text-ink"
            >
              Motif
            </label>
            <select
              id="leave-reason"
              className={fieldClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmId(null)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-background px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={confirmRemove}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white transition-[opacity,transform] hover:opacity-90 disabled:opacity-60"
              >
                {isPending ? "Retrait…" : "Confirmer le retrait"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
