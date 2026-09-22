"use server";

import bcrypt from "bcryptjs";
import { ResidencePlanType, ResidenceStatus, Role } from "@prisma/client";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail/mailer";
import { residenceActivatedEmail } from "@/lib/mail/templates";
import {
  getBillingUrls,
  getStripe,
  getStripePriceId,
  isStripeConfigured,
  STRIPE_TRIAL_DAYS,
} from "@/lib/stripe";

export type SelfServeResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function parseManagerName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "-" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * Crée résidence + gestionnaire, ouvre Checkout avec essai 14 jours.
 */
export async function startSelfServeResidence(input: {
  residenceName: string;
  city: string;
  address: string;
  operator: string;
  managerName: string;
  managerEmail: string;
  managerPassword: string;
}): Promise<SelfServeResult> {
  if (!isStripeConfigured()) {
    return {
      ok: false,
      error:
        "Inscription en ligne indisponible pour le moment. Contacte le support.",
    };
  }

  const stripe = getStripe();
  const priceId = getStripePriceId();
  if (!stripe || !priceId) {
    return { ok: false, error: "Configuration Stripe incomplète." };
  }

  const name = input.residenceName.trim();
  const city = input.city.trim();
  const address = input.address.trim();
  const operator = input.operator.trim() || "Indépendant";
  const managerEmail = input.managerEmail.trim().toLowerCase();
  const managerPassword = input.managerPassword;
  const { firstName, lastName } = parseManagerName(input.managerName);

  if (!name) return { ok: false, error: "Nom de la résidence requis." };
  if (!city) return { ok: false, error: "Ville requise." };
  if (!address) return { ok: false, error: "Adresse requise." };
  if (!firstName) return { ok: false, error: "Ton nom est requis." };
  if (!managerEmail.includes("@")) {
    return { ok: false, error: "E-mail professionnel valide requis." };
  }
  if (managerPassword.length < 8) {
    return { ok: false, error: "Mot de passe : 8 caractères minimum." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: managerEmail },
  });
  if (existingUser) {
    return {
      ok: false,
      error: "Cet e-mail a déjà un compte. Connecte-toi plutôt.",
    };
  }

  const passwordHash = await bcrypt.hash(managerPassword, 10);

  const result = await prisma.$transaction(async (tx) => {
    const manager = await tx.user.create({
      data: {
        email: managerEmail,
        passwordHash,
        firstName,
        lastName,
        role: Role.MANAGER,
      },
    });

    const residence = await tx.residence.create({
      data: {
        name,
        city,
        address,
        operator,
        status: ResidenceStatus.ACTIVE,
        planType: ResidencePlanType.PAID,
        managerId: manager.id,
      },
    });

    return { residence, manager };
  });

  const customer = await stripe.customers.create({
    email: result.manager.email,
    name: `${result.manager.firstName} ${result.manager.lastName}`.trim(),
    metadata: {
      residenceId: result.residence.id,
      residenceName: result.residence.name,
    },
  });

  await prisma.residence.update({
    where: { id: result.residence.id },
    data: { stripeCustomerId: customer.id },
  });

  const urls = getBillingUrls();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: urls.selfServeSuccess,
    cancel_url: urls.selfServeCancel,
    client_reference_id: result.residence.id,
    metadata: {
      residenceId: result.residence.id,
      selfServe: "1",
    },
    subscription_data: {
      trial_period_days: STRIPE_TRIAL_DAYS,
      metadata: {
        residenceId: result.residence.id,
        selfServe: "1",
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    return { ok: false, error: "Impossible d’ouvrir le paiement Stripe." };
  }

  await setSessionCookie({
    userId: result.manager.id,
    role: Role.MANAGER,
    email: result.manager.email,
    firstName: result.manager.firstName,
    lastName: result.manager.lastName,
  });

  const activated = residenceActivatedEmail({
    managerName: result.manager.firstName,
    residenceName: result.residence.name,
    managerEmail: result.manager.email,
  });
  await sendEmail({
    to: result.manager.email,
    subject: activated.subject,
    html: activated.html,
    text: activated.text,
    template: activated.template,
    meta: { residenceId: result.residence.id, source: "self_serve" },
  });

  return { ok: true, url: session.url };
}
