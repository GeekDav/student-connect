import Stripe from "stripe";
import { getAppUrl } from "@/lib/mail/mailer";

/** Essai gratuit self-serve (jours). */
export const STRIPE_TRIAL_DAYS = 14;

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim(),
  );
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  return new Stripe(key, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
}

export function getStripePriceId() {
  return process.env.STRIPE_PRICE_ID?.trim() || null;
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || null;
}

export function getBillingUrls() {
  const base = getAppUrl();
  return {
    success: `${base}/gestionnaire/abonnement?checkout=success`,
    cancel: `${base}/gestionnaire/abonnement?checkout=cancel`,
    return: `${base}/gestionnaire/abonnement`,
    selfServeSuccess: `${base}/gestionnaire?welcome=1`,
    selfServeCancel: `${base}/creer-residence?checkout=cancel`,
  };
}

export function getStripeRuntimeInfo() {
  const secret = process.env.STRIPE_SECRET_KEY?.trim() || "";
  const mode = secret.startsWith("sk_live")
    ? "live"
    : secret.startsWith("sk_test")
      ? "test"
      : "off";
  return {
    configured: isStripeConfigured(),
    mode,
    priceId: getStripePriceId(),
    webhookReady: Boolean(getStripeWebhookSecret()),
    trialDays: STRIPE_TRIAL_DAYS,
  };
}

export type PublicPricing = {
  amountLabel: string;
  intervalLabel: string;
  trialDays: number;
  configured: boolean;
};

/** Prix public lu depuis Stripe (change le prix dans le Dashboard → la landing suit). */
export async function getPublicPricing(): Promise<PublicPricing> {
  const fallback: PublicPricing = {
    amountLabel: "—",
    intervalLabel: "par mois et par résidence",
    trialDays: STRIPE_TRIAL_DAYS,
    configured: false,
  };

  const stripe = getStripe();
  const priceId = getStripePriceId();
  if (!stripe || !priceId) return fallback;

  try {
    const price = await stripe.prices.retrieve(priceId);
    const cents = price.unit_amount ?? 0;
    const currency = (price.currency || "eur").toUpperCase();
    const amountLabel = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);

    const interval = price.recurring?.interval;
    const intervalLabel =
      interval === "year"
        ? "par an et par résidence"
        : "par mois et par résidence";

    return {
      amountLabel,
      intervalLabel,
      trialDays: STRIPE_TRIAL_DAYS,
      configured: true,
    };
  } catch {
    return fallback;
  }
}

/** Statuts Stripe qui gardent la résidence active. */
export function isSubscriptionActiveStatus(status: string | null | undefined) {
  return status === "active" || status === "trialing";
}

/** Statuts qui mettent la résidence en pause. */
export function isSubscriptionPausedStatus(status: string | null | undefined) {
  return (
    status === "canceled" ||
    status === "unpaid" ||
    status === "incomplete_expired" ||
    status === "paused"
  );
}
