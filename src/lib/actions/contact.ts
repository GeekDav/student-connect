"use server";

import { sendEmail } from "@/lib/mail/mailer";
import { pilotContactEmail } from "@/lib/mail/templates";

export type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string };

function getContactInbox() {
  return (
    process.env.CONTACT_EMAIL?.trim().toLowerCase() ||
    process.env.EMAIL_FROM?.match(/<([^>]+)>/)?.[1]?.trim().toLowerCase() ||
    process.env.EMAIL_FROM?.trim().toLowerCase() ||
    null
  );
}

export async function submitPilotContact(input: {
  name: string;
  residenceName: string;
  city: string;
  email: string;
  message: string;
}): Promise<ContactActionResult> {
  const name = input.name.trim();
  const residenceName = input.residenceName.trim();
  const city = input.city.trim();
  const email = input.email.trim().toLowerCase();
  const message = input.message.trim();

  if (!name) return { ok: false, error: "Indique ton nom." };
  if (!residenceName) return { ok: false, error: "Indique le nom de la résidence." };
  if (!city) return { ok: false, error: "Indique la ville." };
  if (!email.includes("@")) return { ok: false, error: "E-mail invalide." };
  if (message.length < 10) {
    return { ok: false, error: "Message trop court (10 caractères mini)." };
  }
  if (message.length > 2000) {
    return { ok: false, error: "Message trop long (2000 caractères max)." };
  }

  const inbox = getContactInbox();
  if (!inbox || !inbox.includes("@")) {
    return {
      ok: false,
      error:
        "Formulaire temporairement indisponible. Réessaie plus tard ou reconnecte-toi si tu es déjà partenaire.",
    };
  }

  const tpl = pilotContactEmail({
    name,
    residenceName,
    city,
    email,
    message,
  });

  const result = await sendEmail({
    to: inbox,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    template: tpl.template,
    meta: {
      fromEmail: email,
      residenceName,
      city,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true };
}
