import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { utcToLocalDateTime } from "@/domain/dates";
import { getAssessment } from "@/server/assessments/service";
import { requireStaffPage } from "@/server/auth/pages";
import { appTimeZone } from "@/server/config";
import { NotFoundError } from "@/server/http/errors";
import { AssessmentForm } from "../../assessment-form";

export const metadata: Metadata = { title: "Edit assessment · Student Registry" };

export default async function EditAssessmentPage({ params }: PageProps<"/staff/assessments/[id]/edit">) {
  await requireStaffPage();
  const { id } = await params;
  const assessment = await getAssessment(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={`Edit ${assessment.title}`}
        description={`${assessment.module.code} ${assessment.module.title}`}
        back={{ href: `/staff/assessments/${id}`, label: assessment.title }}
      />
      <AssessmentForm
        mode="edit"
        assessmentId={id}
        timeZone={appTimeZone()}
        initial={{ title: assessment.title, deadline: utcToLocalDateTime(new Date(assessment.deadline), appTimeZone()) }}
      />
    </>
  );
}
