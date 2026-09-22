"use client";

import Link from "next/link";

export function ResidencePauseBanner({
  variant = "student",
  planType,
}: {
  variant?: "student" | "manager";
  planType?: "PILOT" | "PAID";
}) {
  const student =
    "L’espace de ta résidence est en pause. Tu peux encore consulter, mais pas publier ni envoyer de messages.";

  const managerPilot =
    "Cette résidence pilote est en pause. Les étudiants sont en lecture seule — demande au support (super-admin) de rouvrir l’espace.";

  const managerPaid =
    "Cette résidence est en pause. Les étudiants sont en lecture seule. Réactive le paiement pour tout rouvrir.";

  const managerText =
    planType === "PILOT" ? managerPilot : managerPaid;

  return (
    <div
      className="mb-6 rounded-2xl border border-[#c9853a]/40 bg-[#fff6eb] px-4 py-4 sm:px-5"
      role="status"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a4b1a]">
        Espace en pause
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">
        {variant === "manager" ? managerText : student}
      </p>
      {variant === "manager" && planType !== "PILOT" ? (
        <Link
          href="/gestionnaire/abonnement"
          className="mt-3 inline-flex h-10 items-center rounded-lg bg-accent px-3.5 text-sm font-semibold text-white transition-[background-color,transform] hover:bg-accent-hover hover:-translate-y-0.5"
        >
          Réactiver l’abonnement
        </Link>
      ) : null}
    </div>
  );
}
