"use server";

import { ResidenceStatus, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppUrl, sendEmail } from "@/lib/mail/mailer";
import { weeklyPausedReminderEmail } from "@/lib/mail/templates";

export type EmailLogItem = {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: string;
  bodyPreview: string;
  createdAt: string;
};

export async function listRecentEmailLogs(): Promise<EmailLogItem[]> {
  const session = await getSession();
  if (!session || session.role !== Role.SUPER_ADMIN) return [];

  const rows = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((row) => ({
    id: row.id,
    to: row.to,
    subject: row.subject,
    template: row.template,
    status: row.status,
    bodyPreview: row.bodyPreview,
    createdAt: row.createdAt.toISOString(),
  }));
}

export type WeeklyReminderResult =
  | { ok: true; sent: number; skipped: number }
  | { ok: false; error: string };

/** Envoie (ou log) un rappel aux gestionnaires des résidences en pause. */
export async function runWeeklyPausedReminders(): Promise<WeeklyReminderResult> {
  const paused = await prisma.residence.findMany({
    where: { status: ResidenceStatus.PAUSED },
    include: {
      manager: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  let sent = 0;
  let skipped = 0;
  const weekAgo = Date.now() - 6 * 24 * 60 * 60 * 1000;

  for (const residence of paused) {
    if (!residence.manager?.email) {
      skipped += 1;
      continue;
    }
    if (
      residence.lastPauseReminderAt &&
      residence.lastPauseReminderAt.getTime() > weekAgo
    ) {
      skipped += 1;
      continue;
    }

    const tpl = weeklyPausedReminderEmail({
      managerName: residence.manager.firstName,
      residenceName: residence.name,
      retainUntilLabel: residence.retainUntil
        ? residence.retainUntil.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : null,
    });

    const result = await sendEmail({
      to: residence.manager.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: tpl.template,
      meta: { residenceId: residence.id },
    });

    if (result.ok) {
      await prisma.residence.update({
        where: { id: residence.id },
        data: { lastPauseReminderAt: new Date() },
      });
      sent += 1;
    } else {
      skipped += 1;
    }
  }

  return { ok: true, sent, skipped };
}

export async function triggerWeeklyPausedReminders(): Promise<WeeklyReminderResult> {
  const session = await getSession();
  if (!session || session.role !== Role.SUPER_ADMIN) {
    return { ok: false, error: "Accès réservé au super-admin." };
  }

  const result = await runWeeklyPausedReminders();
  revalidatePath("/super-admin/emails");
  return result;
}

export function getMailRuntimeInfo() {
  const mode =
    process.env.EMAIL_MODE === "resend" && process.env.RESEND_API_KEY
      ? "resend"
      : "log";
  return {
    mode,
    appUrl: getAppUrl(),
    from:
      process.env.EMAIL_FROM?.trim() ||
      "Student-Connect <onboarding@resend.dev>",
  };
}
