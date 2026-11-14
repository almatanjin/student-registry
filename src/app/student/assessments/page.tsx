import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OpenBadge, SubmissionBadge } from "@/components/assessment-badges";
import { EmptyState, PageHeader } from "@/components/page-header";
import { listAssessmentsForStudent } from "@/server/assessments/service";
import { requireStudentPage } from "@/server/auth/pages";
import { dateTime } from "@/server/config";

export const metadata: Metadata = { title: "Assessments · Student Registry" };

export default async function StudentAssessmentsPage() {
  const user = await requireStudentPage();
  const assessments = await listAssessmentsForStudent(user.studentId);

  return (
    <>
      <PageHeader title="Assessments" description="Assessments for the modules on your programme, earliest deadline first." />
      {assessments.length === 0 ? (
        <EmptyState title="No assessments yet">Your assessments will appear here once staff set them.</EmptyState>
      ) : (
        <ul className="grid gap-3" aria-label="Your assessments">
          {assessments.map((assessment) => {
            return (
              <li key={assessment.id}>
                <Link
                  href={`/student/assessments/${assessment.id}`}
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{assessment.title}</p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-mono text-xs">{assessment.module.code}</span> {assessment.module.title}
                    </p>
                    <p className="mt-1 text-sm">
                      Deadline {dateTime(assessment.deadline)}
                      {assessment.deadlinePassed ? <span className="text-muted-foreground"> (passed)</span> : null}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <SubmissionBadge state={assessment.submission.state} />
                    <OpenBadge isOpen={assessment.isOpen} />
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
