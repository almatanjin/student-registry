import { Pill } from "@/components/status-badge";
import type { SubmissionState } from "@/domain/submissions";

const SUBMISSION: Record<SubmissionState, { label: string; className: string }> = {
  "on-time": { label: "On time", className: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300" },
  late: { label: "Late", className: "bg-orange-100 text-orange-800 ring-orange-600/30 dark:bg-orange-950 dark:text-orange-300" },
  missing: { label: "Not submitted", className: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function SubmissionBadge({ state }: { state: SubmissionState }) {
  return <Pill className={SUBMISSION[state].className}>{SUBMISSION[state].label}</Pill>;
}

export function OpenBadge({ isOpen }: { isOpen: boolean }) {
  return isOpen ? (
    <Pill className="bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300">Open</Pill>
  ) : (
    <Pill className="bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300">Closed</Pill>
  );
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
