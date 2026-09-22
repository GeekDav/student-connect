import Link from "next/link";
import { MembershipStatus, Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function ManagerDashboard() {
  const session = await getSession();
  const residence =
    session?.role === Role.SUPER_ADMIN
      ? await prisma.residence.findFirst({
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
        })
      : session
        ? await prisma.residence.findFirst({
            where: { managerId: session.userId },
          })
        : null;

  const residenceId = residence?.id;

  const [pendingCount, activeMembers, publishedAnnouncements, openReports] =
    residenceId
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
        ])
      : [0, 0, 0, 0];

  const cards = [
    {
      label: "Inscriptions en attente",
      value: String(pendingCount),
      href: "/gestionnaire/inscriptions",
      hint: "À valider pour ouvrir l’accès",
    },
    {
      label: "Résidents actifs",
      value: String(activeMembers),
      href: "/gestionnaire/residents",
      hint: "Retirer en cas de départ",
    },
    {
      label: "Annonces publiées",
      value: String(publishedAnnouncements),
      href: "/gestionnaire/annonces",
      hint: "Tableau d’affichage numérique",
    },
    {
      label: "Signalements ouverts",
      value: String(openReports),
      href: "/gestionnaire/moderation",
      hint: "Modération légère",
    },
  ];

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Dashboard
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          {residence
            ? `Vue d’ensemble — ${residence.name}`
            : "Aucune résidence liée à ce compte pour le moment."}
        </p>
      </div>

      <ul className="animate-hero-rise-delay mt-8 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              href={card.href}
              className="block rounded-2xl border border-line bg-surface px-5 py-5 transition-[border-color,background-color] hover:border-accent/35 hover:bg-wash/40"
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

      <section className="animate-hero-rise-delay-2 mt-12">
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
            Gérer les résidents
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
