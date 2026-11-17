import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { OpenBadge, SubmissionBadge } from "@/components/assessment-badges";
import { cardColour } from "@/components/card-colours";
import { DOODLES } from "@/components/doodles";
import type { SubmissionState } from "@/domain/submissions";
import { cn } from "@/lib/utils";

type AssessmentCardProps = {
  assessment: {
    id: string;
    title: string;
    isOpen: boolean;
    deadlinePassed: boolean;
    module: { code: string; title: string };
    submission: { state: SubmissionState };
  };
  /** The deadline as shown to people, such as "27 Nov 2026, 17:00". */
  deadline: string;
  /** Such as "In 10 days" or "7 days ago". */
  countdown: string;
  /** The card's place in the list, which picks its colour and doodle. */
  position: number;
};

/** One assessment on the student's Assessments page: a coloured card that links to the assessment. */
export function AssessmentCard({ assessment, deadline, countdown, position }: AssessmentCardProps) {
  const colour = cardColour(position);
  const Doodle = DOODLES[position % DOODLES.length];

  return (
    <Link
      href={`/student/assessments/${assessment.id}`}
      className={cn(
        "relative flex h-full min-h-48 flex-col overflow-hidden rounded-2xl p-4 text-foreground transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50",
        colour.card,
      )}
    >
      <Doodle className={cn("pointer-events-none absolute -top-0.5 -right-1.5 size-20 -rotate-6 opacity-25", colour.accent)} />
      <span className={cn("relative self-start rounded-md px-1.5 py-0.5 font-mono text-xs font-medium", colour.badge)}>
        {assessment.module.code}
      </span>
      <h2 className="relative mt-3 pr-16 text-base font-semibold">{assessment.title}</h2>
      <p className="relative pr-16 text-sm text-foreground/75">{assessment.module.title}</p>

      <p className="relative mt-auto flex items-center gap-1.5 pt-4 text-sm">
        <CalendarDays aria-hidden className={cn("size-4 shrink-0", colour.accent)} />
        <span>
          {deadline} · <span className="font-semibold">{countdown}</span>
        </span>
      </p>
      <div className="relative mt-2.5 flex flex-wrap items-center gap-1.5">
        <SubmissionBadge state={assessment.submission.state} deadlinePassed={assessment.deadlinePassed} />
        <OpenBadge isOpen={assessment.isOpen} />
        <span className={cn("ml-auto inline-flex items-center text-sm font-semibold", colour.accent)}>
          View
          <ChevronRight aria-hidden className="size-4" />
        </span>
      </div>
    </Link>
  );
}
