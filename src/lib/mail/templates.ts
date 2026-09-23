import { getAppUrl } from "@/lib/mail/mailer";

function wrapHtml(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:24px;background:#eef4f5;font-family:Arial,sans-serif;color:#132029;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d5dee3;border-radius:16px;">
    <tr>
      <td style="padding:28px 28px 8px;">
        <p style="margin:0;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#0c6b5c;font-weight:700;">Student-Connect</p>
        <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3;">${title}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:8px 28px 28px;font-size:15px;line-height:1.6;color:#5a6b75;">
        ${bodyHtml}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function residenceActivatedEmail(input: {
  managerName: string;
  residenceName: string;
  managerEmail: string;
  temporaryPassword?: string;
}) {
  const loginUrl = `${getAppUrl()}/connexion`;
  const subject = `Ta résidence « ${input.residenceName} » est active`;
  const text = [
    `Bonjour ${input.managerName},`,
    ``,
    `La résidence « ${input.residenceName} » est maintenant active sur Student-Connect.`,
    `Connexion : ${loginUrl}`,
    `E-mail : ${input.managerEmail}`,
    input.temporaryPassword
      ? `Mot de passe temporaire : ${input.temporaryPassword}`
      : null,
    ``,
    `Tu peux ensuite inviter tes étudiants depuis l’espace gestionnaire.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapHtml(
    "Résidence active",
    `<p>Bonjour ${input.managerName},</p>
     <p>La résidence <strong>${input.residenceName}</strong> est maintenant active.</p>
     <p><a href="${loginUrl}" style="color:#0c6b5c;">Se connecter</a><br/>E-mail : ${input.managerEmail}${
       input.temporaryPassword
         ? `<br/>Mot de passe temporaire : <strong>${input.temporaryPassword}</strong>`
         : ""
     }</p>
     <p>Invite ensuite tes étudiants depuis l’espace gestionnaire.</p>`,
  );

  return { subject, text, html, template: "residence_activated" };
}

export function residencePausedEmail(input: {
  managerName: string;
  residenceName: string;
  retainUntilLabel?: string | null;
}) {
  const subject = `Espace en pause — ${input.residenceName}`;
  const text = [
    `Bonjour ${input.managerName},`,
    ``,
    `L’espace Student-Connect de « ${input.residenceName} » est passé en pause.`,
    `Les étudiants restent en lecture seule.`,
    input.retainUntilLabel
      ? `Données conservées jusqu’au ${input.retainUntilLabel}.`
      : null,
    `Contacte le support pour réactiver, ou renouvelle l’abonnement quand disponible.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapHtml(
    "Espace en pause",
    `<p>Bonjour ${input.managerName},</p>
     <p>L’espace de <strong>${input.residenceName}</strong> est en pause. Les étudiants sont en lecture seule.</p>
     ${
       input.retainUntilLabel
         ? `<p>Données conservées jusqu’au <strong>${input.retainUntilLabel}</strong>.</p>`
         : ""
     }
     <p>Contacte le support pour réactiver, ou renouvelle l’abonnement depuis ton espace gestionnaire.</p>`,
  );

  return { subject, text, html, template: "residence_paused" };
}

export function residenceReactivatedEmail(input: {
  managerName: string;
  residenceName: string;
}) {
  const loginUrl = `${getAppUrl()}/connexion`;
  const subject = `Espace réactivé — ${input.residenceName}`;
  const text = [
    `Bonjour ${input.managerName},`,
    ``,
    `Bonne nouvelle : « ${input.residenceName} » est de nouveau active.`,
    `Les étudiants peuvent à nouveau publier et messager.`,
    `Connexion : ${loginUrl}`,
  ].join("\n");

  const html = wrapHtml(
    "Espace réactivé",
    `<p>Bonjour ${input.managerName},</p>
     <p><strong>${input.residenceName}</strong> est de nouveau active. Les étudiants peuvent republier et messager.</p>
     <p><a href="${loginUrl}" style="color:#0c6b5c;">Ouvrir Student-Connect</a></p>`,
  );

  return { subject, text, html, template: "residence_reactivated" };
}

export function studentInviteEmail(input: {
  residenceName: string;
  inviteUrl: string;
  code: string;
}) {
  const subject = `Invitation — rejoins ${input.residenceName} sur Student-Connect`;
  const text = [
    `Tu es invité(e) à rejoindre « ${input.residenceName} » sur Student-Connect.`,
    ``,
    `Ouvre ce lien : ${input.inviteUrl}`,
    `Ou utilise le code : ${input.code}`,
    ``,
    `Avec l’invitation, ton accès s’ouvre immédiatement après inscription.`,
  ].join("\n");

  const html = wrapHtml(
    "Invitation résidence",
    `<p>Tu es invité(e) à rejoindre <strong>${input.residenceName}</strong>.</p>
     <p><a href="${input.inviteUrl}" style="display:inline-block;padding:12px 18px;background:#0c6b5c;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">Créer mon compte</a></p>
     <p>Code : <strong>${input.code}</strong></p>`,
  );

  return { subject, text, html, template: "student_invite" };
}

export function weeklyPausedReminderEmail(input: {
  managerName: string;
  residenceName: string;
  retainUntilLabel?: string | null;
}) {
  const subject = `Rappel hebdo — ${input.residenceName} est encore en pause`;
  const text = [
    `Bonjour ${input.managerName},`,
    ``,
    `Rappel : l’espace « ${input.residenceName} » est toujours en pause.`,
    input.retainUntilLabel
      ? `Données conservées jusqu’au ${input.retainUntilLabel}.`
      : null,
    `Réactive l’espace dès que possible pour que tes étudiants retrouvent toutes les fonctions.`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = wrapHtml(
    "Rappel — résidence en pause",
    `<p>Bonjour ${input.managerName},</p>
     <p>Rappel hebdomadaire : <strong>${input.residenceName}</strong> est encore en pause.</p>
     ${
       input.retainUntilLabel
         ? `<p>Données conservées jusqu’au <strong>${input.retainUntilLabel}</strong>.</p>`
         : ""
     }
     <p>Réactive l’espace dès que possible pour rouvrir les publications et messages.</p>`,
  );

  return { subject, text, html, template: "weekly_paused_reminder" };
}

export function pilotContactEmail(input: {
  name: string;
  residenceName: string;
  city: string;
  email: string;
  message: string;
}) {
  const subject = `Candidature pilote — ${input.residenceName} (${input.city})`;
  const text = [
    `Nouvelle candidature phase pilote`,
    ``,
    `Nom : ${input.name}`,
    `Résidence : ${input.residenceName}`,
    `Ville : ${input.city}`,
    `E-mail : ${input.email}`,
    ``,
    `Message :`,
    input.message,
  ].join("\n");

  const html = wrapHtml(
    "Candidature pilote",
    `<p><strong>Nom :</strong> ${input.name}<br/>
     <strong>Résidence :</strong> ${input.residenceName}<br/>
     <strong>Ville :</strong> ${input.city}<br/>
     <strong>E-mail :</strong> <a href="mailto:${input.email}">${input.email}</a></p>
     <p style="white-space:pre-wrap;">${input.message.replace(/</g, "&lt;")}</p>`,
  );

  return { subject, text, html, template: "pilot_contact" };
}
