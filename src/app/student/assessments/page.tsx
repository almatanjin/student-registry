import type { Metadata } from "next";
import { AssessmentCard } from "@/components/assessment-card";
import { EmptyState, PageHeader } from "@/components/page-header";
import { deadlineCountdown } from "@/domain/deadlines";
import { listAssessmentsForStudent } from "@/server/assessments/service";
import { requireStudentPage } from "@/server/auth/pages";
import { appTimeZone, dateTime, today } from "@/server/config";

export const metadata: Metadata = { title: "Assessments · Student Registry" };

export default async function StudentAssessmentsPage() {
  const user = await requireStudentPage();
  const assessments = await listAssessmentsForStudent(user.studentId);
  const todayDate = today();
  const timeZone = appTimeZone();

  return (
    <>
      <PageHeader title="Assessments" description="Assessments for the modules on your programme, earliest deadline first." />
      {assessments.length === 0 ? (
        <EmptyState title="No assessments yet">Your assessments will appear here once staff set them.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Your assessments">
          {assessments.map((assessment, position) => (
            <li key={assessment.id}>
              <AssessmentCard
                assessment={assessment}
                deadline={dateTime(assessment.deadline)}
                countdown={deadlineCountdown(new Date(assessment.deadline), todayDate, timeZone)}
                position={position}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
