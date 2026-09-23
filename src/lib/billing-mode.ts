/**
 * Mode facturation publique.
 * Par défaut OFF = phase pilote gratuite (SA crée les résidences).
 * Remettre BILLING_ENABLED=true pour rouvrir tarif + Checkout + /creer-residence.
 */
export function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "true";
}
