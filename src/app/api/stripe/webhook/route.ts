import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  applySubscriptionToResidence,
  findResidenceIdFromStripe,
} from "@/lib/stripe-sync";
import {
  getStripe,
  getStripeWebhookSecret,
} from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handleSubscription(
  subscription: Stripe.Subscription,
  notify: boolean,
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const residenceId = await findResidenceIdFromStripe({
    customerId,
    subscriptionId: subscription.id,
    metadataResidenceId: subscription.metadata?.residenceId ?? null,
  });
  if (!residenceId) {
    console.warn("[stripe] subscription without residence", subscription.id);
    return;
  }

  await applySubscriptionToResidence({
    residenceId,
    customerId,
    subscriptionId: subscription.id,
    status: subscription.status,
    notify,
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = getStripeWebhookSecret();
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook non configuré." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Signature invalide.";
    console.error("[stripe] webhook signature", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const residenceId =
          session.metadata?.residenceId ||
          session.client_reference_id ||
          null;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;

        if (!residenceId || !subscriptionId) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await applySubscriptionToResidence({
          residenceId,
          customerId,
          subscriptionId: subscription.id,
          status: subscription.status,
          notify: true,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        await handleSubscription(
          event.data.object as Stripe.Subscription,
          true,
        );
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscription(
          { ...subscription, status: "canceled" },
          true,
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("[stripe] webhook handler", error);
    return NextResponse.json(
      { error: "Erreur traitement webhook." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
