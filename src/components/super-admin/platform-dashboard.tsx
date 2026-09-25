"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { PlatformDashboardData } from "@/lib/actions/super-admin-analytics";
import {
  DonutChart,
  HorizontalBars,
  StackedActivityChart,
} from "@/components/super-admin/sa-charts";

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "accent";
}) {
  const valueClass =
    tone === "warn"
      ? "text-[#9a4b1a]"
      : tone === "accent"
        ? "text-accent"
        : "text-ink";
  return (
    <div className="border-b border-line py-4 sm:border-b-0 sm:border-r sm:px-4 sm:py-1 last:sm:border-r-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function PlatformDashboard({ data }: { data: PlatformDashboardData }) {
  const { kpis, series, alerts, topActive, residences } = data;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">(
    "all",
  );
  const [sort, setSort] = useState<"activity" | "students" | "name">("activity");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = residences.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        r.managerName.toLowerCase().includes(q)
      );
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "fr");
      if (sort === "students") return b.studentsActive - a.studentsActive;
      return b.activity7d - a.activity7d;
    });
    return rows;
  }, [residences, query, statusFilter, sort]);

  return (
    <div className="space-y-10">
      <div className="animate-hero-rise flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Vue d’ensemble
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
            Pulse plateforme : vie étudiante et charge gestionnaire par résidence.
            Mis à jour {data.generatedAt}.
          </p>
        </div>
        <Link
          href="/super-admin/residences"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
        >
          Gérer les résidences
        </Link>
      </div>

      <section className="animate-hero-rise-delay grid grid-cols-2 border-y border-line sm:grid-cols-3 lg:grid-cols-6">
        <Kpi
          label="Résidences"
          value={kpis.residencesTotal}
          hint={`${kpis.residencesActive} actives · ${kpis.residencesPaused} pause`}
        />
        <Kpi
          label="Étudiants"
          value={kpis.studentsActive}
          hint={`${kpis.studentsPending} en attente`}
          tone={kpis.studentsPending > 0 ? "warn" : "default"}
        />
        <Kpi label="Activité 7 j." value={kpis.activity7d} hint="Créations totales" tone="accent" />
        <Kpi label="SOS ouverts" value={kpis.sosOpen} />
        <Kpi label="Recyclerie" value={kpis.marketActive} />
        <Kpi
          label="Signalements"
          value={kpis.reportsOpen}
          tone={kpis.reportsOpen > 0 ? "warn" : "default"}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Activité plateforme · 30 jours
              </h3>
              <p className="mt-1 text-sm text-muted">
                Inscriptions, SOS, recyclerie, events, mur — toutes résidences.
              </p>
            </div>
            <p className="text-xs text-muted">
              Events live · {kpis.eventsLive} · Mur 7 j. · {kpis.wallNotes7d} ·
              Annonces · {kpis.announcementsLive}
            </p>
          </div>
          <StackedActivityChart series={series} />
        </section>

        <section className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Portefeuille
            </h3>
            <p className="mt-1 mb-4 text-sm text-muted">Statut des résidences</p>
            <DonutChart
              centerLabel="total"
              centerValue={kpis.residencesTotal}
              segments={[
                {
                  label: "Actives",
                  value: kpis.residencesActive,
                  color: "#0c6b5c",
                },
                {
                  label: "En pause",
                  value: kpis.residencesPaused,
                  color: "#9a4b1a",
                },
              ]}
            />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
              Plans
            </h3>
            <p className="mt-1 mb-4 text-sm text-muted">
              Part pilote vs payant (même total que le portefeuille).
            </p>
            <DonutChart
              centerLabel="plans"
              centerValue={kpis.residencesTotal}
              segments={[
                {
                  label: "Pilote",
                  value: kpis.residencesPilot,
                  color: "#1d4f7a",
                },
                {
                  label: "Payant",
                  value: kpis.residencesPaid,
                  color: "#0c6b5c",
                },
              ]}
            />
          </div>
        </section>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="font-display text-lg font-semibold text-ink">
            Top activité · 7 jours
          </h3>
          <p className="mt-1 mb-4 text-sm text-muted">
            Résidences les plus vivantes (créations étudiantes).
          </p>
          <HorizontalBars
            valueLabel="act."
            items={topActive.map((r) => ({
              id: r.id,
              name: r.name,
              value: r.activity7d,
              href: `/super-admin/residences/${r.id}`,
            }))}
          />
        </section>

        <section>
          <h3 className="font-display text-lg font-semibold text-ink">
            À surveiller
          </h3>
          <p className="mt-1 mb-4 text-sm text-muted">
            Files d’attente, silence, pauses, modération.
          </p>
          <ul className="divide-y divide-line border-y border-line">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <Link
                  href={alert.href}
                  className="block py-3.5 transition-colors hover:bg-wash/60"
                >
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      alert.severity === "high"
                        ? "text-[#9a4b1a]"
                        : alert.severity === "medium"
                          ? "text-accent"
                          : "text-muted"
                    }`}
                  >
                    {alert.severity === "high"
                      ? "Priorité"
                      : alert.severity === "medium"
                        ? "Attention"
                        : "Info"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {alert.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{alert.detail}</p>
                </Link>
              </li>
            ))}
            {alerts.length === 0 ? (
              <li className="py-8 text-center text-sm text-muted">
                Rien d’urgent — la plateforme tourne proprement.
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold text-ink">
              Résidences · pulse
            </h3>
            <p className="mt-1 text-sm text-muted">
              Recherche et tri — conçu pour tenir à l’échelle (200+).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, ville, opérateur…"
              className="h-10 w-full min-w-[12rem] rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent sm:w-56"
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="paused">En pause</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-ink"
            >
              <option value="activity">Tri · activité 7 j.</option>
              <option value="students">Tri · étudiants</option>
              <option value="name">Tri · nom</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border-y border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="py-3 pr-3 font-semibold">Résidence</th>
                <th className="py-3 px-2 font-semibold">Étudiants</th>
                <th className="py-3 px-2 font-semibold">Attente</th>
                <th className="py-3 px-2 font-semibold">SOS</th>
                <th className="py-3 px-2 font-semibold">Recyclerie</th>
                <th className="py-3 px-2 font-semibold">Events</th>
                <th className="py-3 px-2 font-semibold">Mur 7 j.</th>
                <th className="py-3 px-2 font-semibold">Act. 7 j.</th>
                <th className="py-3 pl-2 font-semibold">Signalements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-wash/50">
                  <td className="py-3.5 pr-3">
                    <Link
                      href={`/super-admin/residences/${r.id}`}
                      className="font-semibold text-ink hover:text-accent"
                    >
                      {r.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted">
                      {r.city} ·{" "}
                      <span
                        className={
                          r.status === "active" ? "text-accent" : "text-[#9a4b1a]"
                        }
                      >
                        {r.status === "active" ? "Active" : "Pause"}
                      </span>
                      {" · "}
                      {r.planType === "pilot" ? "Pilote" : "Payant"}
                    </p>
                  </td>
                  <td className="px-2 py-3.5 tabular-nums">{r.studentsActive}</td>
                  <td
                    className={`px-2 py-3.5 tabular-nums ${
                      r.studentsPending > 0 ? "font-semibold text-[#9a4b1a]" : ""
                    }`}
                  >
                    {r.studentsPending}
                  </td>
                  <td className="px-2 py-3.5 tabular-nums">{r.sosOpen}</td>
                  <td className="px-2 py-3.5 tabular-nums">{r.marketActive}</td>
                  <td className="px-2 py-3.5 tabular-nums">{r.eventsLive}</td>
                  <td className="px-2 py-3.5 tabular-nums">{r.wallNotes7d}</td>
                  <td className="px-2 py-3.5 font-semibold tabular-nums text-accent">
                    {r.activity7d}
                  </td>
                  <td
                    className={`py-3.5 pl-2 tabular-nums ${
                      r.reportsOpen > 0 ? "font-semibold text-[#9a4b1a]" : ""
                    }`}
                  >
                    {r.reportsOpen}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-10 text-center text-muted"
                  >
                    Aucune résidence pour ce filtre.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          {filtered.length} / {residences.length} résidence
          {residences.length > 1 ? "s" : ""}
        </p>
      </section>
    </div>
  );
}
