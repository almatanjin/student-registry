import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cardColour } from "@/components/card-colours";
import { Pill } from "@/components/status-badge";
import { moduleResultStatus } from "@/domain/results";
import { cn } from "@/lib/utils";
import type { ModuleResultSummary } from "@/server/results/service";

type ModuleResultCardProps = {
  summary: ModuleResultSummary;
  /** The card's place in the list, which picks its colour. */
  position: number;
};

/** One module on the staff Results page: a coloured card with one pill saying what the module needs next. */
export function ModuleResultCard({ summary, position }: ModuleResultCardProps) {
  const colour = cardColour(position);
  const status = moduleResultStatus(summary.assessmentCount, summary.counts);
  const assessments = `${summary.assessmentCount} ${summary.assessmentCount === 1 ? "assessment" : "assessments"}`;

  return (
    <Link
      href={`/staff/results/${summary.id}`}
      className={cn(
        "flex h-full min-h-40 flex-col rounded-2xl p-4 text-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
        colour.card,
      )}
    >
      <span className={cn("self-start rounded-md px-1.5 py-0.5 font-mono text-xs font-medium", colour.badge)}>
        {summary.code}
      </span>
      <h2 className="mt-3 text-base font-semibold">{summary.title}</h2>
      <p className="text-sm text-foreground/75">
        {summary.programmeName} · {assessments}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <Pill tone={status.tone} data-slot="module-result-status">
          {status.label}
        </Pill>
        <span className={cn("ml-auto inline-flex items-center text-sm font-semibold", colour.accent)}>
          View results
          <ChevronRight aria-hidden className="size-4" />
        </span>
      </div>
    </Link>
  );
}
