import type { Metadata } from "next";
import Link from "next/link";
import { ResidencesList } from "@/components/super-admin/residences-list";
import { listPlatformResidences } from "@/lib/actions/super-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Résidences en pause — Super-admin",
  description: "Suivi des résidences en pause à relancer.",
};

export default async function SuperAdminPausedPage() {
  const all = await listPlatformResidences();
  const paused = all.filter((item) => item.status === "paused");

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">
            <Link href="/super-admin/residences" className="text-accent hover:opacity-70">
              Toutes les résidences
            </Link>
            <span className="mx-2 text-line">·</span>
            En pause
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
            Résidences en pause · {paused.length}
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            Liste pour relancer les gestionnaires. Rappels hebdo : page{" "}
            <Link href="/super-admin/emails" className="text-accent hover:opacity-70">
              E-mails
            </Link>{" "}
            ou cron du lundi 9h UTC.
          </p>
        </div>
      </div>

      {paused.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-wash/40 px-5 py-10 text-center text-sm text-muted">
          Aucune résidence en pause pour le moment.
        </p>
      ) : (
        <ResidencesList initialItems={paused} showHeader={false} />
      )}
    </div>
  );
}
