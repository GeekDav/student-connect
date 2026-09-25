"use server";

import {
  MembershipStatus,
  MarketplaceStatus,
  ResidenceStatus,
  Role,
  SosStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SERIES_DAYS = 30;

export type PlatformKpis = {
  residencesTotal: number;
  residencesActive: number;
  residencesPaused: number;
  residencesPilot: number;
  residencesPaid: number;
  studentsActive: number;
  studentsPending: number;
  sosOpen: number;
  marketActive: number;
  eventsLive: number;
  wallNotes7d: number;
  announcementsLive: number;
  reportsOpen: number;
  activity7d: number;
};

export type ActivityDayPoint = {
  /** YYYY-MM-DD */
  day: string;
  label: string;
  joins: number;
  sos: number;
  market: number;
  events: number;
  wall: number;
  total: number;
};

export type ResidencePulseRow = {
  id: string;
  name: string;
  city: string;
  operator: string;
  status: "active" | "paused";
  planType: "pilot" | "paid";
  createdAt: string;
  managerName: string;
  managerEmail: string;
  studentsActive: number;
  studentsPending: number;
  sosOpen: number;
  marketActive: number;
  eventsLive: number;
  wallNotes7d: number;
  wallNotesToday: number;
  announcementsLive: number;
  reportsOpen: number;
  /** Créations étudiantes (SOS+market+events+wall+joins) sur 7 j. */
  activity7d: number;
  lastActivityAt: string | null;
  pausedAt: string | null;
  retainUntil: string | null;
};

export type PlatformAlert = {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  href: string;
};

export type PlatformDashboardData = {
  generatedAt: string;
  kpis: PlatformKpis;
  series: ActivityDayPoint[];
  residences: ResidencePulseRow[];
  alerts: PlatformAlert[];
  topActive: { id: string; name: string; activity7d: number }[];
};

export type ResidenceDetailData = {
  residence: ResidencePulseRow;
  series: ActivityDayPoint[];
  breakdown: {
    label: string;
    value: number;
    hint: string;
  }[];
};

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.role !== Role.SUPER_ADMIN) return null;
  return session;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function emptySeries(days: number): ActivityDayPoint[] {
  const today = startOfDay(new Date());
  const out: ActivityDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push({
      day: dayKey(d),
      label: formatDayLabel(d),
      joins: 0,
      sos: 0,
      market: 0,
      events: 0,
      wall: 0,
      total: 0,
    });
  }
  return out;
}

function bump(
  map: Map<string, ActivityDayPoint>,
  createdAt: Date,
  key: keyof Pick<
    ActivityDayPoint,
    "joins" | "sos" | "market" | "events" | "wall"
  >,
) {
  const k = dayKey(createdAt);
  const row = map.get(k);
  if (!row) return;
  row[key] += 1;
  row.total += 1;
}

function countMap(
  rows: { residenceId: string; _count: { _all: number } }[],
): Map<string, number> {
  const m = new Map<string, number>();
  for (const row of rows) m.set(row.residenceId, row._count._all);
  return m;
}

function getCount(m: Map<string, number>, id: string) {
  return m.get(id) ?? 0;
}

export async function getPlatformDashboard(): Promise<PlatformDashboardData | null> {
  const session = await requireSuperAdmin();
  if (!session) return null;

  const residences = await prisma.residence.findMany({
    include: {
      manager: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { name: "asc" },
  });

  const residenceIds = residences.map((r) => r.id);
  const now = new Date();

  if (residenceIds.length === 0) {
    return {
      generatedAt: formatDateTime(now),
      kpis: {
        residencesTotal: 0,
        residencesActive: 0,
        residencesPaused: 0,
        residencesPilot: 0,
        residencesPaid: 0,
        studentsActive: 0,
        studentsPending: 0,
        sosOpen: 0,
        marketActive: 0,
        eventsLive: 0,
        wallNotes7d: 0,
        announcementsLive: 0,
        reportsOpen: 0,
        activity7d: 0,
      },
      series: emptySeries(SERIES_DAYS),
      residences: [],
      alerts: [],
      topActive: [],
    };
  }

  const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dayStart = startOfDay(now);
  const seriesStart = startOfDay(
    new Date(now.getTime() - (SERIES_DAYS - 1) * 86400000),
  );

  const [
    activeMembers,
    pendingMembers,
    sosOpen,
    marketActive,
    eventsLive,
    wallNotes7d,
    wallNotesToday,
    announcementsLive,
    reportsOpen,
    joinsSeries,
    sosSeries,
    marketSeries,
    eventsSeries,
    wallSeries,
    lastSos,
    lastMarket,
    lastEvent,
    lastWall,
    lastJoin,
  ] = await Promise.all([
    prisma.residenceMembership.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: MembershipStatus.ACTIVE,
      },
      _count: { _all: true },
    }),
    prisma.residenceMembership.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: MembershipStatus.PENDING,
      },
      _count: { _all: true },
    }),
    prisma.sosRequest.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: { in: [SosStatus.OPEN, SosStatus.HELPED] },
        expiresAt: { gt: now },
      },
      _count: { _all: true },
    }),
    prisma.marketplaceItem.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: {
          in: [MarketplaceStatus.AVAILABLE, MarketplaceStatus.RESERVED],
        },
        expiresAt: { gt: now },
      },
      _count: { _all: true },
    }),
    prisma.microEvent.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        endsAt: { gt: now },
      },
      _count: { _all: true },
    }),
    prisma.wallNote.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: day7 },
      },
      _count: { _all: true },
    }),
    prisma.wallNote.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: dayStart },
      },
      _count: { _all: true },
    }),
    prisma.officialAnnouncement.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        published: true,
      },
      _count: { _all: true },
    }),
    prisma.moderationReport.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: "OPEN",
      },
      _count: { _all: true },
    }),
    prisma.residenceMembership.findMany({
      where: {
        residenceId: { in: residenceIds },
        status: MembershipStatus.ACTIVE,
        createdAt: { gte: seriesStart },
      },
      select: { residenceId: true, createdAt: true },
    }),
    prisma.sosRequest.findMany({
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: seriesStart },
      },
      select: { residenceId: true, createdAt: true },
    }),
    prisma.marketplaceItem.findMany({
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: seriesStart },
      },
      select: { residenceId: true, createdAt: true },
    }),
    prisma.microEvent.findMany({
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: seriesStart },
      },
      select: { residenceId: true, createdAt: true },
    }),
    prisma.wallNote.findMany({
      where: {
        residenceId: { in: residenceIds },
        createdAt: { gte: seriesStart },
      },
      select: { residenceId: true, createdAt: true },
    }),
    prisma.sosRequest.groupBy({
      by: ["residenceId"],
      where: { residenceId: { in: residenceIds } },
      _max: { createdAt: true },
    }),
    prisma.marketplaceItem.groupBy({
      by: ["residenceId"],
      where: { residenceId: { in: residenceIds } },
      _max: { createdAt: true },
    }),
    prisma.microEvent.groupBy({
      by: ["residenceId"],
      where: { residenceId: { in: residenceIds } },
      _max: { createdAt: true },
    }),
    prisma.wallNote.groupBy({
      by: ["residenceId"],
      where: { residenceId: { in: residenceIds } },
      _max: { createdAt: true },
    }),
    prisma.residenceMembership.groupBy({
      by: ["residenceId"],
      where: {
        residenceId: { in: residenceIds },
        status: MembershipStatus.ACTIVE,
      },
      _max: { createdAt: true },
    }),
  ]);

  const mActive = countMap(activeMembers);
  const mPending = countMap(pendingMembers);
  const mSos = countMap(sosOpen);
  const mMarket = countMap(marketActive);
  const mEvents = countMap(eventsLive);
  const mWall7 = countMap(wallNotes7d);
  const mWallToday = countMap(wallNotesToday);
  const mAnn = countMap(announcementsLive);
  const mReports = countMap(reportsOpen);

  const activityByResidence = new Map<string, number>();
  const lastActivity = new Map<string, Date>();

  function touchLast(id: string, d: Date | null | undefined) {
    if (!d) return;
    const prev = lastActivity.get(id);
    if (!prev || d > prev) lastActivity.set(id, d);
  }

  for (const row of lastSos) touchLast(row.residenceId, row._max.createdAt);
  for (const row of lastMarket) touchLast(row.residenceId, row._max.createdAt);
  for (const row of lastEvent) touchLast(row.residenceId, row._max.createdAt);
  for (const row of lastWall) touchLast(row.residenceId, row._max.createdAt);
  for (const row of lastJoin) touchLast(row.residenceId, row._max.createdAt);

  const series = emptySeries(SERIES_DAYS);
  const seriesMap = new Map(series.map((p) => [p.day, p]));

  function trackActivity(id: string, createdAt: Date) {
    if (createdAt >= day7) {
      activityByResidence.set(id, (activityByResidence.get(id) ?? 0) + 1);
    }
  }

  for (const row of joinsSeries) {
    bump(seriesMap, row.createdAt, "joins");
    trackActivity(row.residenceId, row.createdAt);
  }
  for (const row of sosSeries) {
    bump(seriesMap, row.createdAt, "sos");
    trackActivity(row.residenceId, row.createdAt);
  }
  for (const row of marketSeries) {
    bump(seriesMap, row.createdAt, "market");
    trackActivity(row.residenceId, row.createdAt);
  }
  for (const row of eventsSeries) {
    bump(seriesMap, row.createdAt, "events");
    trackActivity(row.residenceId, row.createdAt);
  }
  for (const row of wallSeries) {
    bump(seriesMap, row.createdAt, "wall");
    trackActivity(row.residenceId, row.createdAt);
  }

  const rows: ResidencePulseRow[] = residences.map((r) => {
    const id = r.id;
    const last = lastActivity.get(id) ?? null;
    return {
      id,
      name: r.name,
      city: r.city,
      operator: r.operator,
      status: r.status === ResidenceStatus.ACTIVE ? "active" : "paused",
      planType: r.planType === "PAID" ? "paid" : "pilot",
      createdAt: formatShortDate(r.createdAt),
      managerName: r.manager
        ? `${r.manager.firstName} ${r.manager.lastName}`
        : "Non assigné",
      managerEmail: r.manager?.email ?? "—",
      studentsActive: getCount(mActive, id),
      studentsPending: getCount(mPending, id),
      sosOpen: getCount(mSos, id),
      marketActive: getCount(mMarket, id),
      eventsLive: getCount(mEvents, id),
      wallNotes7d: getCount(mWall7, id),
      wallNotesToday: getCount(mWallToday, id),
      announcementsLive: getCount(mAnn, id),
      reportsOpen: getCount(mReports, id),
      activity7d: activityByResidence.get(id) ?? 0,
      lastActivityAt: last ? formatDateTime(last) : null,
      pausedAt: r.pausedAt ? formatShortDate(r.pausedAt) : null,
      retainUntil: r.retainUntil ? formatShortDate(r.retainUntil) : null,
    };
  });

  const kpis: PlatformKpis = {
    residencesTotal: rows.length,
    residencesActive: rows.filter((r) => r.status === "active").length,
    residencesPaused: rows.filter((r) => r.status === "paused").length,
    residencesPilot: rows.filter((r) => r.planType === "pilot").length,
    residencesPaid: rows.filter((r) => r.planType === "paid").length,
    studentsActive: rows.reduce((s, r) => s + r.studentsActive, 0),
    studentsPending: rows.reduce((s, r) => s + r.studentsPending, 0),
    sosOpen: rows.reduce((s, r) => s + r.sosOpen, 0),
    marketActive: rows.reduce((s, r) => s + r.marketActive, 0),
    eventsLive: rows.reduce((s, r) => s + r.eventsLive, 0),
    wallNotes7d: rows.reduce((s, r) => s + r.wallNotes7d, 0),
    announcementsLive: rows.reduce((s, r) => s + r.announcementsLive, 0),
    reportsOpen: rows.reduce((s, r) => s + r.reportsOpen, 0),
    activity7d: rows.reduce((s, r) => s + r.activity7d, 0),
  };

  const alerts: PlatformAlert[] = [];
  for (const r of rows) {
    if (r.studentsPending >= 5) {
      alerts.push({
        id: `pending-${r.id}`,
        severity: "high",
        title: `${r.name} · ${r.studentsPending} inscriptions en attente`,
        detail: "File d’attente gestionnaire à traiter.",
        href: `/super-admin/residences/${r.id}`,
      });
    }
    if (r.reportsOpen >= 3) {
      alerts.push({
        id: `reports-${r.id}`,
        severity: "high",
        title: `${r.name} · ${r.reportsOpen} signalements ouverts`,
        detail: "Modération en retard côté résidence.",
        href: `/super-admin/residences/${r.id}`,
      });
    }
    if (
      r.status === "active" &&
      r.studentsActive > 0 &&
      r.activity7d === 0
    ) {
      alerts.push({
        id: `quiet-${r.id}`,
        severity: "medium",
        title: `${r.name} · aucune activité 7 j.`,
        detail: `${r.studentsActive} résidents actifs, zéro publication récente.`,
        href: `/super-admin/residences/${r.id}`,
      });
    }
    if (r.status === "paused") {
      alerts.push({
        id: `pause-${r.id}`,
        severity: "low",
        title: `${r.name} en pause`,
        detail: r.retainUntil
          ? `Données retenues jusqu’au ${r.retainUntil}.`
          : "Résidence en pause.",
        href: `/super-admin/en-pause`,
      });
    }
  }

  alerts.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  const topActive = [...rows]
    .sort((a, b) => b.activity7d - a.activity7d)
    .slice(0, 8)
    .map((r) => ({ id: r.id, name: r.name, activity7d: r.activity7d }));

  return {
    generatedAt: formatDateTime(now),
    kpis,
    series,
    residences: rows,
    alerts: alerts.slice(0, 12),
    topActive,
  };
}

export async function getResidenceAnalytics(
  residenceId: string,
): Promise<ResidenceDetailData | null> {
  const dash = await getPlatformDashboard();
  if (!dash) return null;
  const residence = dash.residences.find((r) => r.id === residenceId);
  if (!residence) return null;

  const now = new Date();
  const seriesStart = startOfDay(
    new Date(now.getTime() - (SERIES_DAYS - 1) * 86400000),
  );

  const [joinsSeries, sosSeries, marketSeries, eventsSeries, wallSeries] =
    await Promise.all([
      prisma.residenceMembership.findMany({
        where: {
          residenceId,
          status: MembershipStatus.ACTIVE,
          createdAt: { gte: seriesStart },
        },
        select: { createdAt: true },
      }),
      prisma.sosRequest.findMany({
        where: { residenceId, createdAt: { gte: seriesStart } },
        select: { createdAt: true },
      }),
      prisma.marketplaceItem.findMany({
        where: { residenceId, createdAt: { gte: seriesStart } },
        select: { createdAt: true },
      }),
      prisma.microEvent.findMany({
        where: { residenceId, createdAt: { gte: seriesStart } },
        select: { createdAt: true },
      }),
      prisma.wallNote.findMany({
        where: { residenceId, createdAt: { gte: seriesStart } },
        select: { createdAt: true },
      }),
    ]);

  const series = emptySeries(SERIES_DAYS);
  const seriesMap = new Map(series.map((p) => [p.day, p]));
  for (const row of joinsSeries) bump(seriesMap, row.createdAt, "joins");
  for (const row of sosSeries) bump(seriesMap, row.createdAt, "sos");
  for (const row of marketSeries) bump(seriesMap, row.createdAt, "market");
  for (const row of eventsSeries) bump(seriesMap, row.createdAt, "events");
  for (const row of wallSeries) bump(seriesMap, row.createdAt, "wall");

  return {
    residence,
    series,
    breakdown: [
      {
        label: "Résidents actifs",
        value: residence.studentsActive,
        hint: "Memberships ACTIVE",
      },
      {
        label: "En attente",
        value: residence.studentsPending,
        hint: "À valider par le gestionnaire",
      },
      {
        label: "SOS ouverts",
        value: residence.sosOpen,
        hint: "Hors résolus / expirés",
      },
      {
        label: "Recyclerie active",
        value: residence.marketActive,
        hint: "Hors partis / expirés",
      },
      {
        label: "Events live",
        value: residence.eventsLive,
        hint: "Non terminés",
      },
      {
        label: "Mur (7 j.)",
        value: residence.wallNotes7d,
        hint: `${residence.wallNotesToday} aujourd’hui`,
      },
      {
        label: "Annonces live",
        value: residence.announcementsLive,
        hint: "Publiées gestionnaire",
      },
      {
        label: "Signalements",
        value: residence.reportsOpen,
        hint: "Ouverts",
      },
    ],
  };
}
