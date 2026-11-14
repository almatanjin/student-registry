import { Pill } from "@/components/status-badge";
import { RESULT_STATE_LABELS, type Classification, type ResultState } from "@/domain/results";

const CLASSIFICATION: Record<Classification, string> = {
  Distinction: "bg-violet-50 text-violet-800 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-300",
  Merit: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300",
  Pass: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300",
  Fail: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300",
};

const STATE: Record<ResultState, string> = {
  PENDING: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300",
  PUBLISHED: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300",
  WITHHELD: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300",
};

export function ClassificationBadge({ classification }: { classification: Classification }) {
  return <Pill className={CLASSIFICATION[classification]}>{classification}</Pill>;
}

export function ResultStateBadge({ state }: { state: ResultState }) {
  return <Pill className={STATE[state]}>{RESULT_STATE_LABELS[state]}</Pill>;
}
