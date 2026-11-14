/**
 * Calendar dates are passed around as ISO strings ("2026-01-15"), which compare
 * correctly as strings and carry no time zone.
 */
export type IsoDate = string;

/** The calendar date at `now` in the given IANA time zone, as "YYYY-MM-DD". */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "2026-12-01T17:00" in a local time zone → the matching instant, or null if the text is not a valid local date-time. */
export function localDateTimeToUtc(local: string, timeZone: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(asUtc);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) return null;

  // Guess the offset at that wall-clock time, then correct once in case the guess crossed a clock change.
  let instant = asUtc - offsetMs(asUtc, timeZone);
  instant = asUtc - offsetMs(instant, timeZone);
  return new Date(instant);
}

/** An instant as "YYYY-MM-DDTHH:mm" in the time zone, the format datetime-local inputs use. */
export function utcToLocalDateTime(instant: Date, timeZone: string): string {
  const parts = zonedParts(instant.getTime(), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function zonedParts(instant: number, timeZone: string) {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (type: string) => formatted.find((part) => part.type === type)?.value ?? "00";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
}

/** How far the zone's wall clock is ahead of UTC at the instant, in milliseconds. */
function offsetMs(instant: number, timeZone: string): number {
  const parts = zonedParts(instant, timeZone);
  const wallClock = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return wallClock - Math.floor(instant / 60_000) * 60_000;
}
