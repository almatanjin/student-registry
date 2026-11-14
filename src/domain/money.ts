/** Money is held as whole minor units (pence) everywhere; this only formats it for display. */
export function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}

/**
 * "2,500.00" → 250000. Accepts digits with optional comma thousands separators and up to two decimals.
 * Works on the text itself, so no floating-point rounding is involved. Returns null for anything else.
 */
export function parseMoneyToMinor(text: string): number | null {
  const match = /^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const whole = Number(match[1].replaceAll(",", ""));
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = whole * 100 + fraction;
  return Number.isSafeInteger(minor) ? minor : null;
}
