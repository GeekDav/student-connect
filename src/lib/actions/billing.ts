"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { isBillingEnabled } from "@/lib/billing-mode";
import { prisma } from "@/lib/db";
import {
  getBillingUrls,
  getStripe,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe";

export type BillingInfo = {
  configured: boolean;
  billingEnabled: boolean;
  residenceId: string;
  residenceName: string;
  planType: "PILOT" | "PAID";
  status: "ACTIVE" | "PAUSED";
  subscriptionStatus: string | null;
  hasCustomer: boolean;
  hasSubscription: boolean;
};

export type BillingActionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

async function getManagerBillingResidence() {
  const session = await getSession();
  if (!session) return null;
  if (session.role !== Role.MANAGER && session.role !== Role.SUPER_ADMIN) {
    return null;
  }

  const residence = await prisma.residence.findFirst({
    where:
      session.role === Role.SUPER_ADMIN
        ? {}
        : { managerId: session.userId },
    orderBy: { createdAt: "asc" },
    include: {
      manager: { select: { email: true, firstName: true, lastName: true } },
    },
  });
  if (!residence) return null;

  return { session, residence };
}

export async function getBillingInfo(): Promise<BillingInfo | null> {
  const ctx = await getManagerBillingResidence();
  if (!ctx) return null;

  return {
    configured: isStripeConfigured(),
    billingEnabled: isBillingEnabled(),
    residenceId: ctx.residence.id,
    residenceName: ctx.residence.name,
    planType: ctx.residence.planType,
    status: ctx.residence.status,
    subscriptionStatus: ctx.residence.stripeSubscriptionStatus,
    hasCustomer: Boolean(ctx.residence.stripeCustomerId),
    hasSubscription: Boolean(ctx.residence.stripeSubscriptionId),
  };
}

export async function createCheckoutSession(): Promise<BillingActionResult> {
  if (!isBillingEnabled()) {
    return {
      ok: false,
      error: "La facturation est désactivée pendant la phase pilote.",
    };
  }

  const ctx = await getManagerBillingResidence();
  if (!ctx) return { ok: false, error: "Action non autorisée." };

  const stripe = getStripe();
  const priceId = getStripePriceId();
  if (!stripe || !priceId) {
    return {
      ok: false,
      error:
        "Stripe n’est pas configuré (STRIPE_SECRET_KEY + STRIPE_PRICE_ID).",
    };
  }

  const manager = ctx.residence.manager;
  if (!manager?.email) {
    return { ok: false, error: "Aucun gestionnaire e-mail sur cette résidence." };
  }

  let customerId = ctx.residence.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: manager.email,
      name: `${manager.firstName} ${manager.lastName}`.trim(),
      metadata: {
        residenceId: ctx.residence.id,
        residenceName: ctx.residence.name,
      },
    });
    customerId = customer.id;
    await prisma.residence.update({
      where: { id: ctx.residence.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const urls = getBillingUrls();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: urls.success,
    cancel_url: urls.cancel,
    client_reference_id: ctx.residence.id,
    metadata: { residenceId: ctx.residence.id },
    subscription_data: {
      metadata: { residenceId: ctx.residence.id },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return { ok: false, error: "Impossible de créer la session Checkout." };
  }

  return { ok: true, url: session.url };
}

export async function createBillingPortalSession(): Promise<BillingActionResult> {
  if (!isBillingEnabled()) {
    return {
      ok: false,
      error: "La facturation est désactivée pendant la phase pilote.",
    };
  }

  const ctx = await getManagerBillingResidence();
  if (!ctx) return { ok: false, error: "Action non autorisée." };

  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe n’est pas configuré." };
  }

  if (!ctx.residence.stripeCustomerId) {
    return {
      ok: false,
      error: "Aucun client Stripe. Lance d’abord un abonnement.",
    };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.residence.stripeCustomerId,
    return_url: getBillingUrls().return,
  });

  revalidatePath("/gestionnaire/abonnement");
  return { ok: true, url: session.url };
}
