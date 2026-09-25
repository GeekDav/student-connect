"use client";

import Link from "next/link";
import type { ResidenceDetailData } from "@/lib/actions/super-admin-analytics";
import { StackedActivityChart } from "@/components/super-admin/sa-charts";

export function ResidenceDetailDashboard({
  data,
}: {
  data: ResidenceDetailData;
}) {
  const { residence: r, series, breakdown } = data;

  return (
    <div className="space-y-10">
      <div className="animate-hero-rise">
        <p className="text-sm text-muted">
          <Link href="/super-admin" className="text-accent hover:opacity-70">
            Vue d’ensemble
          </Link>
          <span className="mx-2 text-line">·</span>
          <Link
            href="/super-admin/residences"
            className="text-accent hover:opacity-70"
          >
            Résidences
          </Link>
          <span className="mx-2 text-line">·</span>
          {r.name}
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {r.name}
            </h2>
            <p className="mt-2 text-base text-muted">
              {r.city} · {r.operator} ·{" "}
              <span
                className={
                  r.status === "active" ? "text-accent" : "text-[#9a4b1a]"
                }
              >
                {r.status === "active" ? "Active" : "En pause"}
              </span>
              {" · "}
              {r.planType === "pilot" ? "Pilote" : "Payant"}
            </p>
            <p className="mt-2 text-sm text-muted">
              Gestionnaire · {r.managerName} · {r.managerEmail}
            </p>
            <p className="mt-1 text-xs text-muted">
              Créée le {r.createdAt}
              {r.lastActivityAt
                ? ` · Dernière activité ${r.lastActivityAt}`
                : " · Aucune activité enregistrée"}
            </p>
          </div>
          <Link
            href="/super-admin/residences"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg border border-line bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            ← Liste résidences
          </Link>
        </div>
      </div>

      <section className="animate-hero-rise-delay grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {breakdown.map((item) => (
          <div key={item.label} className="bg-surface px-4 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {item.label}
            </p>
            <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-ink">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-muted">{item.hint}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="font-display text-lg font-semibold text-ink">
          Vie de la résidence · 30 jours
        </h3>
        <p className="mt-1 mb-4 text-sm text-muted">
          Activité étudiante (inscriptions validées, SOS, recyclerie, events,
          mur).
        </p>
        <StackedActivityChart series={series} />
      </section>

      <section className="border-y border-line py-6">
        <h3 className="font-display text-lg font-semibold text-ink">
          Lecture rapide
        </h3>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li className="text-sm text-muted">
            <span className="font-semibold text-ink">Charge gestionnaire · </span>
            {r.studentsPending} inscription
            {r.studentsPending !== 1 ? "s" : ""} en attente · {r.reportsOpen}{" "}
            signalement{r.reportsOpen !== 1 ? "s" : ""} · {r.announcementsLive}{" "}
            annonce{r.announcementsLive !== 1 ? "s" : ""} live
          </li>
          <li className="text-sm text-muted">
            <span className="font-semibold text-ink">Vie étudiante · </span>
            {r.activity7d} création{r.activity7d !== 1 ? "s" : ""} sur 7 j. ·{" "}
            {r.wallNotesToday} note{r.wallNotesToday !== 1 ? "s" : ""} mur
            aujourd’hui · {r.sosOpen + r.marketActive + r.eventsLive} items live
            (SOS + recyclerie + events)
          </li>
        </ul>
      </section>
    </div>
  );
}
