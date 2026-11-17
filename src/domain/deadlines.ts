import { todayIn, type IsoDate } from "./dates";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar days from `today` to the deadline's date in the time zone, as text such as "In 10 days". */
export function deadlineCountdown(deadline: Date, today: IsoDate, timeZone: string): string {
  const days = daysBetween(today, todayIn(timeZone, deadline));
  if (days === -1) return "1 day ago";
  if (days < 0) return `${-days} days ago`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}
