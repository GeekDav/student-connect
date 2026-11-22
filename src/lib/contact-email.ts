/** Adresse pro affichée (landing, pieds de mail). Alignée sur CONTACT_EMAIL en prod. */
export const DEFAULT_CONTACT_EMAIL = "contact@student-connect.fr";

export function getPublicContactEmail(): string {
  const fromEnv = process.env.CONTACT_EMAIL?.trim().toLowerCase();
  if (fromEnv?.includes("@")) return fromEnv;
  return DEFAULT_CONTACT_EMAIL;
}