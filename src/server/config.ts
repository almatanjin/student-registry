import { todayIn, type IsoDate } from "@/domain/dates";
import { formatMoney } from "@/domain/money";

export function appTimeZone(): string {
  return process.env.APP_TIMEZONE || "Europe/London";
}

export function appCurrency(): string {
  return process.env.APP_CURRENCY || "GBP";
}

/** Today's date in the configured time zone. */
export function today(now: Date = new Date()): IsoDate {
  return todayIn(appTimeZone(), now);
}

/** Formats minor units in the configured currency. */
export function money(amountMinor: number): string {
  return formatMoney(amountMinor, appCurrency());
}

/** An instant shown in the configured time zone, such as "1 Dec 2026, 17:00". */
export function dateTime(iso: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: appTimeZone(),
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
}
