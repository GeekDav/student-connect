/** Accepte un code brut ou une URL `/inscription?invite=XXXX`. */
export function normalizeInviteInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
      const url = /^https?:\/\//i.test(trimmed)
        ? new URL(trimmed)
        : new URL(trimmed, "https://student-connect.local");
      const fromQuery = url.searchParams.get("invite");
      if (fromQuery?.trim()) return fromQuery.trim().toUpperCase();
    }
  } catch {
    // ignore parse errors
  }

  const queryMatch = trimmed.match(/[?&]invite=([^&\s#]+)/i);
  if (queryMatch?.[1]) {
    return decodeURIComponent(queryMatch[1]).trim().toUpperCase();
  }

  return trimmed.toUpperCase();
}
