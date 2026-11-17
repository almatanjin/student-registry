import { STATUS_LABELS, type EnrolmentStatus } from "@/domain/schemas/student";
import { cn } from "@/lib/utils";

/** One colour per meaning, set in theme.css. See the comment there for which labels use which tone. */
export type Tone = "green" | "yellow" | "red" | "blue" | "purple" | "sky" | "neutral";

const TONES: Record<Tone, string> = {
  green: "bg-tone-green text-tone-green-foreground ring-tone-green-foreground/20",
  yellow: "bg-tone-yellow text-tone-yellow-foreground ring-tone-yellow-foreground/25",
  red: "bg-tone-red text-tone-red-foreground ring-tone-red-foreground/20",
  blue: "bg-tone-blue text-tone-blue-foreground ring-tone-blue-foreground/20",
  purple: "bg-tone-purple text-tone-purple-foreground ring-tone-purple-foreground/20",
  sky: "bg-tone-sky text-tone-sky-foreground ring-tone-sky-foreground/25",
  neutral: "bg-tone-neutral text-tone-neutral-foreground ring-tone-neutral-foreground/20",
};

const STATUS_TONES: Record<EnrolmentStatus, Tone> = {
  ENROLLED: "green",
  DEFERRED: "yellow",
  WITHDRAWN: "neutral",
  COMPLETED: "blue",
};

export function StatusBadge({ status }: { status: EnrolmentStatus }) {
  return <Pill tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Pill>;
}

/** Small rounded label used for every status-like badge, so they all look the same. */
export function Pill({ tone, className, children, ...props }: React.ComponentProps<"span"> & { tone: Tone }) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
