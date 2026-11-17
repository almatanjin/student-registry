import { Pill, type Tone } from "@/components/status-badge";
import type { SubmissionState } from "@/domain/submissions";

const SUBMISSION: Record<SubmissionState, { label: string; tone: Tone }> = {
  "on-time": { label: "On time", tone: "green" },
  late: { label: "Late", tone: "yellow" },
  missing: { label: "Not submitted", tone: "neutral" },
};

/** Pass `deadlinePassed` to show "Not submitted" in red once the deadline has gone by; without it the pill stays grey. */
export function SubmissionBadge({ state, deadlinePassed = false }: { state: SubmissionState; deadlinePassed?: boolean }) {
  const tone = state === "missing" && deadlinePassed ? "red" : SUBMISSION[state].tone;
  return <Pill tone={tone}>{SUBMISSION[state].label}</Pill>;
}

export function OpenBadge({ isOpen }: { isOpen: boolean }) {
  return isOpen ? <Pill tone="sky">Open</Pill> : <Pill tone="neutral">Closed</Pill>;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
