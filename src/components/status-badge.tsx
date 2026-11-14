import { STATUS_LABELS, type EnrolmentStatus } from "@/domain/schemas/student";
import { cn } from "@/lib/utils";

const STYLES: Record<EnrolmentStatus, string> = {
  ENROLLED: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300",
  DEFERRED: "bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300",
  WITHDRAWN: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300",
  COMPLETED: "bg-sky-50 text-sky-800 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300",
};

export function StatusBadge({ status }: { status: EnrolmentStatus }) {
  return <Pill className={STYLES[status]}>{STATUS_LABELS[status]}</Pill>;
}

/** Small rounded label used for every status-like badge, so they all look the same. */
export function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        className,
      )}
    >
      {children}
    </span>
  );
}
