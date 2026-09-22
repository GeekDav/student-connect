import Stripe from "stripe";
import { getAppUrl } from "@/lib/mail/mailer";

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
  };
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
