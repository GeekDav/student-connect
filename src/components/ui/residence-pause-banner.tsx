export function ResidencePauseBanner({
  variant = "student",
}: {
  variant?: "student" | "manager";
}) {
  const student =
    "L’espace de ta résidence est en pause (abonnement). Tu peux encore consulter, mais pas publier ni envoyer de messages pour le moment.";
  const manager =
    "Cette résidence est en pause. Les étudiants sont en lecture seule. Réactive l’abonnement (Stripe bientôt) ou demande au support de rouvrir l’espace.";

  return (
    <div
      className="mb-6 rounded-2xl border border-[#c9853a]/40 bg-[#fff6eb] px-4 py-4 sm:px-5"
      role="status"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9a4b1a]">
        Espace en pause
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">
        {variant === "manager" ? manager : student}
      </p>
    </div>
  );
}
