import Link from "next/link";
import {
  MembershipStatus,
  ResidenceStatus,
  Role,
  SosStatus,
} from "@prisma/client";
import { getSession } from "@/lib/auth";
import { STUDENT_FEED_ANNOUNCEMENT_LIMIT } from "@/lib/announcement-limits";
import { prisma } from "@/lib/db";

type InboxItem = {
  id: string;
  kind: "inscription" | "signalement" | "sos";
  title: string;
  detail: string;
  href: string;
  urgency: "high" | "normal";
};

export async function ManagerDashboard({
  welcome = false,
}: {
  welcome?: boolean;
}) {
  const session = await getSession();
  const residence =
    session?.role === Role.SUPER_ADMIN
      ? await prisma.residence.findFirst({
          orderBy: { createdAt: "asc" },
        })
      : session
        ? await prisma.residence.findFirst({
            where: { managerId: session.userId },
          })
        : null;

  const residenceId = residence?.id;
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    pendingCount,
    activeMembers,
    publishedAnnouncements,
    openReports,
    openSos,
    recentEvents,
    pendingRows,
    reportRows,
    sosRows,
  ] = residenceId
    ? await Promise.all([
        prisma.residenceMembership.count({
          where: { residenceId, status: MembershipStatus.PENDING },
        }),
        prisma.residenceMembership.count({
          where: { residenceId, status: MembershipStatus.ACTIVE },
        }),
        prisma.officialAnnouncement.count({
          where: { residenceId, published: true },
        }),
        prisma.moderationReport.count({
          where: { residenceId, status: "OPEN" },
        }),
        prisma.sosRequest.count({
          where: {
            residenceId,
            status: { in: [SosStatus.OPEN, SosStatus.HELPED] },
            expiresAt: { gt: new Date() },
          },
        }),
        prisma.microEvent.count({
          where: {
            residenceId,
            startsAt: { gte: weekAgo },
          },
        }),
        prisma.residenceMembership.findMany({
          where: { residenceId, status: MembershipStatus.PENDING },
          include: { user: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "asc" },
          take: 5,
        }),
        prisma.moderationReport.findMany({
          where: { residenceId, status: "OPEN" },
          orderBy: { createdAt: "asc" },
          take: 5,
        }),
        prisma.sosRequest.findMany({
          where: {
            residenceId,
            status: { in: [SosStatus.OPEN, SosStatus.HELPED] },
            expiresAt: { gt: new Date() },
          },
          include: { author: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: "asc" },
          take: 5,
        }),
      ])
    : [0, 0, 0, 0, 0, 0, [], [], []];

  const pulse = [
    {
      label: "Résidents actifs",
      value: String(activeMembers),
      href: "/gestionnaire/residents",
      hint: "Annuaire opérationnel",
      warn: false,
    },
    {
      label: "À valider",
      value: String(pendingCount),
      href: "/gestionnaire/inscriptions",
      hint: "Inscriptions en attente",
      warn: false,
    },
    {
      label: "SOS ouverts",
      value: String(openSos),
      href: "/sos",
      hint: "Entraide en cours",
      warn: false,
    },
    {
      label: "Signalements",
      value: String(openReports),
      href: "/gestionnaire/moderation",
      hint: "Modération à traiter",
      warn: false,
    },
    {
      label: "Annonces live",
      value:
        publishedAnnouncements >= STUDENT_FEED_ANNOUNCEMENT_LIMIT
          ? `${publishedAnnouncements} · plein`
          : String(publishedAnnouncements),
      href: "/gestionnaire/annonces",
      hint:
        publishedAnnouncements >= STUDENT_FEED_ANNOUNCEMENT_LIMIT
          ? `Feed étudiant plafonné à ${STUDENT_FEED_ANNOUNCEMENT_LIMIT}`
          : "Tableau d’affichage",
      warn: publishedAnnouncements >= STUDENT_FEED_ANNOUNCEMENT_LIMIT,
    },
    {
      label: "Events (7 j.)",
      value: String(recentEvents),
      href: "/evenements",
      hint: "Activité récente",
      warn: false,
    },
  ];

  const inbox: InboxItem[] = [
    ...pendingRows.map((row) => ({
      id: `m-${row.id}`,
      kind: "inscription" as const,
      title: `${row.user.firstName} ${row.user.lastName}`,
      detail: "Inscription en attente de validation",
      href: "/gestionnaire/inscriptions",
      urgency: "high" as const,
    })),
    ...reportRows.map((row) => ({
      id: `r-${row.id}`,
      kind: "signalement" as const,
      title: row.reason.slice(0, 80) || "Signalement",
      detail: "Signalement ouvert à traiter",
      href: "/gestionnaire/moderation",
      urgency: "high" as const,
    })),
    ...sosRows.map((row) => ({
      id: `s-${row.id}`,
      kind: "sos" as const,
      title: row.title,
      detail: `SOS de ${row.author.firstName} ${row.author.lastName}${
        row.createdAt < dayAgo ? " · > 24 h" : ""
      }`,
      href: "/sos",
      urgency: (row.createdAt < dayAgo ? "high" : "normal") as InboxItem["urgency"],
    })),
  ].slice(0, 8);

  const todoCount = pendingCount + openReports + openSos;

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Dashboard
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          {residence
            ? `Pouls de ${residence.name}${
                residence.status === ResidenceStatus.PAUSED
                  ? " · en pause"
                  : ""
              }`
            : "Aucune résidence liée à ce compte pour le moment."}
        </p>
      </div>

      {welcome ? (
        <p className="animate-hero-rise-delay mt-6 rounded-2xl border border-accent/30 bg-wash px-5 py-4 text-sm leading-relaxed text-ink">
          Bienvenue dans le pilote. Invite des étudiants, suis le pouls
          ci‑dessous, et dis-nous ce qui te manque au quotidien.
        </p>
      ) : null}

      {residence?.status === ResidenceStatus.PAUSED ? (
        <div className="animate-hero-rise-delay mt-6 rounded-2xl border border-line bg-surface px-5 py-5">
          <p className="font-display text-lg font-semibold text-ink">
            Réactivation
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {residence.planType === "PILOT"
              ? "Pilote gratuit : demande au super-admin de rouvrir l’espace depuis son tableau."
              : "Espace en pause : contacte le support Student-Connect pour le rouvrir (phase pilote sans paiement en ligne)."}
          </p>
          <Link
            href="/gestionnaire/abonnement"
            className="mt-4 inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Voir l’offre
          </Link>
          {residence.retainUntil ? (
            <p className="mt-2 text-xs text-muted">
              Données conservées jusqu’au{" "}
              {residence.retainUntil.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              .
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="animate-hero-rise-delay mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
            Pouls de la résidence
          </h3>
          <Link
            href="/gestionnaire/abonnement"
            className="text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            Offre pilote
          </Link>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pulse.map((card) => (
            <li key={card.label}>
              <Link
                href={card.href}
                className={`block rounded-2xl border px-5 py-5 transition-[border-color,background-color] ${
                  card.warn
                    ? "border-[#c9853a]/50 bg-[#fff6eb] hover:border-[#c9853a]/70"
                    : "border-line bg-surface hover:border-accent/35 hover:bg-wash/40"
                }`}
              >
                <p className="text-sm font-medium text-muted">{card.label}</p>
                <p className="mt-3 font-display text-4xl font-semibold text-ink">
                  {card.value}
                </p>
                <p className="mt-2 text-xs text-muted">{card.hint}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {publishedAnnouncements >= STUDENT_FEED_ANNOUNCEMENT_LIMIT ? (
        <div
          className="animate-hero-rise-delay mt-8 rounded-2xl border border-[#c9853a]/40 bg-[#fff6eb] px-5 py-4"
          role="status"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a4b1a]">
            Tableau d’affichage
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            Tu as {publishedAnnouncements} annonces live. Les étudiants n’en
            voient que les {STUDENT_FEED_ANNOUNCEMENT_LIMIT} plus récentes.
            Dépublie celles qui ne sont plus d’actualité pour libérer de la
            place.
          </p>
          <Link
            href="/gestionnaire/annonces"
            className="mt-3 inline-flex text-sm font-semibold text-[#9a4b1a] transition-opacity hover:opacity-70"
          >
            Gérer les annonces →
          </Link>
        </div>
      ) : null}

      <section className="animate-hero-rise-delay-2 mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
            À traiter · {todoCount}
          </h3>
          {todoCount > 0 ? (
            <p className="text-xs text-muted">
              Priorise inscriptions et signalements
            </p>
          ) : null}
        </div>

        {inbox.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line bg-wash/40 px-5 py-8 text-center text-sm text-muted">
            Rien en attente. Bonne nouvelle — la résidence tourne sans file
            urgente.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {inbox.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex flex-col gap-1 py-4 transition-colors hover:bg-wash/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
                      {item.kind === "inscription"
                        ? "Inscription"
                        : item.kind === "signalement"
                          ? "Signalement"
                          : "SOS"}
                      {item.urgency === "high" ? " · prioritaire" : ""}
                    </p>
                    <p className="mt-1 font-display text-base font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                  </div>
                  <span className="text-sm font-semibold text-accent sm:shrink-0">
                    Ouvrir →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h3 className="font-display text-sm font-semibold tracking-wide text-ink">
          Actions rapides
        </h3>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/gestionnaire/invitations"
            className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
          >
            Inviter des étudiants
          </Link>
          <Link
            href="/gestionnaire/inscriptions"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Valider des inscriptions
          </Link>
          <Link
            href="/gestionnaire/residents"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Résidents / export
          </Link>
          <Link
            href="/gestionnaire/annonces"
            className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash"
          >
            Publier une annonce
          </Link>
        </div>
      </section>
    </div>
  );
}
