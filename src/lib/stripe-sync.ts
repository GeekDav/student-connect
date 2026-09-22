import { ResidenceStatus, ResidencePlanType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/mail/mailer";
import {
  residencePausedEmail,
  residenceReactivatedEmail,
} from "@/lib/mail/templates";
import { pauseRetainUntil } from "@/lib/student-context";
import {
  isSubscriptionActiveStatus,
  isSubscriptionPausedStatus,
} from "@/lib/stripe";

export async function applySubscriptionToResidence(input: {
  residenceId: string;
  customerId?: string | null;
  subscriptionId?: string | null;
  status: string;
  /** Si true, envoie les e-mails pause/réactivation. */
  notify?: boolean;
}) {
  const residence = await prisma.residence.findUnique({
    where: { id: input.residenceId },
    include: {
      manager: { select: { firstName: true, email: true } },
    },
  });
  if (!residence) return { ok: false as const, error: "Résidence introuvable." };

  const wasPaused = residence.status === ResidenceStatus.PAUSED;
  const now = new Date();

  let nextStatus = residence.status;
  let pausedAt = residence.pausedAt;
  let retainUntil = residence.retainUntil;
  let lastPauseReminderAt = residence.lastPauseReminderAt;

  if (isSubscriptionActiveStatus(input.status)) {
    nextStatus = ResidenceStatus.ACTIVE;
    pausedAt = null;
    retainUntil = null;
    lastPauseReminderAt = null;
  } else if (isSubscriptionPausedStatus(input.status)) {
    nextStatus = ResidenceStatus.PAUSED;
    if (!wasPaused) {
      pausedAt = now;
      retainUntil = pauseRetainUntil(now);
    }
  }

  await prisma.residence.update({
    where: { id: residence.id },
    data: {
      planType: ResidencePlanType.PAID,
      status: nextStatus,
      pausedAt,
      retainUntil,
      lastPauseReminderAt,
      stripeCustomerId: input.customerId ?? residence.stripeCustomerId,
      stripeSubscriptionId:
        input.subscriptionId ?? residence.stripeSubscriptionId,
      stripeSubscriptionStatus: input.status,
    },
  });

  if (input.notify !== false && residence.manager?.email) {
    if (
      nextStatus === ResidenceStatus.PAUSED &&
      !wasPaused &&
      isSubscriptionPausedStatus(input.status)
    ) {
      const tpl = residencePausedEmail({
        managerName: residence.manager.firstName,
        residenceName: residence.name,
        retainUntilLabel: retainUntil
          ? retainUntil.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null,
      });
      await sendEmail({
        to: residence.manager.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: tpl.template,
        meta: { residenceId: residence.id, source: "stripe" },
      });
    }

    if (
      nextStatus === ResidenceStatus.ACTIVE &&
      wasPaused &&
      isSubscriptionActiveStatus(input.status)
    ) {
      const tpl = residenceReactivatedEmail({
        managerName: residence.manager.firstName,
        residenceName: residence.name,
      });
      await sendEmail({
        to: residence.manager.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: tpl.template,
        meta: { residenceId: residence.id, source: "stripe" },
      });
    }
  }

  return { ok: true as const, status: nextStatus };
}

export async function findResidenceIdFromStripe(input: {
  customerId?: string | null;
  subscriptionId?: string | null;
  metadataResidenceId?: string | null;
}) {
  if (input.metadataResidenceId) {
    const byMeta = await prisma.residence.findUnique({
      where: { id: input.metadataResidenceId },
      select: { id: true },
    });
    if (byMeta) return byMeta.id;
  }
  if (input.subscriptionId) {
    const bySub = await prisma.residence.findFirst({
      where: { stripeSubscriptionId: input.subscriptionId },
      select: { id: true },
    });
    if (bySub) return bySub.id;
  }
  if (input.customerId) {
    const byCustomer = await prisma.residence.findFirst({
      where: { stripeCustomerId: input.customerId },
      select: { id: true },
    });
    if (byCustomer) return byCustomer.id;
  }
  return null;
}
