/** Règles TTL SOS / Recyclerie (pilote — vraies durées produit). */

export const SOS_TTL_DAYS = 7;
export const SOS_PROLONG_DAYS = 7;
export const SOS_MAX_ACTIVE = 2;
/** Après résolu / expiré : suppression définitive. */
export const SOS_RETENTION_DAYS = 30;

export const MARKET_TTL_DAYS = 30;
export const MARKET_PROLONG_DAYS = 14;
export const MARKET_MAX_ACTIVE = 3;
/** Après parti / expiré : suppression définitive. */
export const MARKET_RETENTION_DAYS = 60;

export function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function daysAgo(days: number): Date {
  return addDays(new Date(), -days);
}

/** Libellé carte : « Jusqu’au 2 oct. » */
export function formatUntilLabel(expiresAt: Date): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(expiresAt);
  return `Jusqu’au ${label}`;
}
