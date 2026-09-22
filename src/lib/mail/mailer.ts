import { prisma } from "@/lib/db";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  meta?: Record<string, string>;
};

export type SendEmailResult =
  | { ok: true; mode: "log" | "sent"; id: string }
  | { ok: false; error: string };

function appUrl() {
  return (
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getAppUrl() {
  return appUrl();
}

function emailMode(): "log" | "resend" {
  if (process.env.EMAIL_MODE === "resend" && process.env.RESEND_API_KEY) {
    return "resend";
  }
  return "log";
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const to = input.to.trim().toLowerCase();
  if (!to.includes("@")) {
    return { ok: false, error: "Destinataire e-mail invalide." };
  }

  const mode = emailMode();
  const from =
    process.env.EMAIL_FROM?.trim() ||
    "Student-Connect <onboarding@resend.dev>";

  if (mode === "log") {
    console.info("[mail:log]", {
      to,
      subject: input.subject,
      template: input.template,
      text: input.text,
    });

    const log = await prisma.emailLog.create({
      data: {
        to,
        subject: input.subject,
        template: input.template,
        bodyPreview: input.text.slice(0, 500),
        status: "logged",
        meta: input.meta ?? undefined,
      },
    });

    return { ok: true, mode: "log", id: log.id };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
    };

    if (!response.ok) {
      const error =
        payload.message || `Envoi Resend échoué (${response.status}).`;
      await prisma.emailLog.create({
        data: {
          to,
          subject: input.subject,
          template: input.template,
          bodyPreview: input.text.slice(0, 500),
          status: "failed",
          meta: { ...(input.meta ?? {}), error },
        },
      });
      return { ok: false, error };
    }

    const log = await prisma.emailLog.create({
      data: {
        to,
        subject: input.subject,
        template: input.template,
        bodyPreview: input.text.slice(0, 500),
        status: "sent",
        meta: { ...(input.meta ?? {}), resendId: payload.id ?? "" },
      },
    });

    return { ok: true, mode: "sent", id: log.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur d’envoi e-mail.";
    await prisma.emailLog.create({
      data: {
        to,
        subject: input.subject,
        template: input.template,
        bodyPreview: input.text.slice(0, 500),
        status: "failed",
        meta: { ...(input.meta ?? {}), error: message },
      },
    });
    return { ok: false, error: message };
  }
}
