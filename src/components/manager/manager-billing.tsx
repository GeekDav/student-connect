"use client";

import { useState, useTransition } from "react";
import {
  createBillingPortalSession,
  createCheckoutSession,
  type BillingInfo,
} from "@/lib/actions/billing";

function statusLabel(status: string | null) {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Essai";
    case "past_due":
      return "Paiement en retard";
    case "canceled":
      return "Annulé";
    case "unpaid":
      return "Impayé";
    case "incomplete":
      return "Incomplet";
    case "incomplete_expired":
      return "Expiré";
    case "paused":
      return "En pause Stripe";
    default:
      return status || "Aucun";
  }
}

export function ManagerBilling({
  initial,
  checkoutFlash,
}: {
  initial: BillingInfo;
  checkoutFlash?: "success" | "cancel" | null;
}) {
  const [info] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function goCheckout() {
    setError(null);
    startTransition(async () => {
      const result = await createCheckoutSession();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  function goPortal() {
    setError(null);
    startTransition(async () => {
      const result = await createBillingPortalSession();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  const needsSubscribe =
    !info.hasSubscription ||
    info.subscriptionStatus === "canceled" ||
    info.subscriptionStatus === "unpaid" ||
    info.subscriptionStatus === "incomplete_expired" ||
    info.status === "PAUSED";

  if (!info.billingEnabled) {
    return (
      <div>
        <div className="animate-hero-rise">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Offre
          </h2>
          <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
            « {info.residenceName} » — phase pilote.
          </p>
        </div>
        <div className="animate-hero-rise-delay mt-8 rounded-2xl border border-line bg-surface px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Gratuit
          </p>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">
            Inclus dans le pilote
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Aucun paiement pour le moment. L’espace est ouvert avec
            Student-Connect. Si un abonnement arrive plus tard, tu seras
            prévenu à l’avance. Pause / réouverture : contacte le support.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li className="rounded-xl border border-line bg-wash/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Plan
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">
                {info.planType === "PILOT" ? "Pilote" : "Payant (préparé)"}
              </p>
            </li>
            <li className="rounded-xl border border-line bg-wash/40 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Espace
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">
                {info.status === "ACTIVE" ? "Actif" : "En pause"}
              </p>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="animate-hero-rise">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Abonnement
        </h2>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
          Abonnement de « {info.residenceName} ». Paiement sécurisé via Stripe.
        </p>
      </div>

      {checkoutFlash === "success" ? (
        <p className="mt-6 rounded-2xl border border-accent/30 bg-wash px-4 py-3 text-sm text-accent">
          Paiement reçu. L’espace se réactive en quelques secondes — recharge si
          besoin.
        </p>
      ) : null}
      {checkoutFlash === "cancel" ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
          Paiement annulé. Tu peux réessayer quand tu veux.
        </p>
      ) : null}

      {!info.configured ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line bg-wash/40 px-5 py-8">
          <p className="font-display text-lg font-semibold text-ink">
            Stripe non configuré
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Ajoute dans{" "}
            <code className="text-xs">.env</code> / Vercel :{" "}
            <code className="text-xs">STRIPE_SECRET_KEY</code>,{" "}
            <code className="text-xs">STRIPE_PRICE_ID</code>,{" "}
            <code className="text-xs">STRIPE_WEBHOOK_SECRET</code>, et{" "}
            <code className="text-xs">APP_URL</code>.
          </p>
        </div>
      ) : (
        <>
          <ul className="animate-hero-rise-delay mt-8 grid gap-3 sm:grid-cols-3">
            <li className="rounded-2xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Plan
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {info.planType === "PILOT" ? "Pilote" : "Payant"}
              </p>
            </li>
            <li className="rounded-2xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Espace
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {info.status === "ACTIVE" ? "Actif" : "En pause"}
              </p>
            </li>
            <li className="rounded-2xl border border-line bg-surface px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Stripe
              </p>
              <p className="mt-2 font-display text-xl font-semibold text-ink">
                {statusLabel(info.subscriptionStatus)}
              </p>
            </li>
          </ul>

          <div className="mt-8 flex flex-wrap gap-2">
            {needsSubscribe ? (
              <button
                type="button"
                disabled={isPending}
                onClick={goCheckout}
                className="inline-flex h-11 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-white transition-[background-color,transform,opacity] hover:bg-accent-hover hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isPending ? "Redirection…" : "S’abonner"}
              </button>
            ) : null}
            {info.hasCustomer ? (
              <button
                type="button"
                disabled={isPending}
                onClick={goPortal}
                className="inline-flex h-11 items-center rounded-lg border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-wash disabled:opacity-60"
              >
                {isPending ? "Redirection…" : "Gérer l’abonnement"}
              </button>
            ) : null}
          </div>

          {error ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <p className="mt-8 max-w-xl text-xs leading-relaxed text-muted">
            Paiement à jour → espace actif. Annulation ou impayé → pause
            (étudiants en lecture seule). Les pilotes gratuits restent gérés par
            le super-admin.
          </p>
        </>
      )}
    </div>
  );
}
