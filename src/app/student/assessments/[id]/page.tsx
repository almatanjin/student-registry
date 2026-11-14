import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Download, Info } from "lucide-react";
import { formatFileSize, OpenBadge, SubmissionBadge } from "@/components/assessment-badges";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RefusalReason } from "@/domain/submissions";
import { getAssessmentForStudent } from "@/server/assessments/service";
import { requireStudentPage } from "@/server/auth/pages";
import { dateTime } from "@/server/config";
import { NotFoundError } from "@/server/http/errors";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Assessment · Student Registry" };

const REFUSAL: Record<RefusalReason, { title: string; body: string }> = {
  closed: { title: "This assessment is closed", body: "Submissions are no longer accepted. Contact your module team if you need help." },
  not_enrolled: {
    title: "Only enrolled students can submit work",
    body: "Your enrolment status does not allow submissions. Contact the Registry team if this is wrong.",
  },
  deadline_passed: {
    title: "The deadline has passed",
    body: "Your submission is kept, but it can no longer be replaced.",
  },
};

export default async function StudentAssessmentPage({ params, searchParams }: PageProps<"/student/assessments/[id]">) {
  const user = await requireStudentPage();
  const { id } = await params;
  const { submitted } = await searchParams;
  const assessment = await getAssessmentForStudent(id, user.studentId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const own = assessment.submission.detail;
  const upload = assessment.upload;

  return (
    <>
      <PageHeader
        title={assessment.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span>
              <span className="font-mono">{assessment.module.code}</span> {assessment.module.title}
            </span>
            <span>·</span>
            <span>Deadline {dateTime(assessment.deadline)}</span>
            <OpenBadge isOpen={assessment.isOpen} />
          </span>
        }
        back={{ href: "/student/assessments", label: "Assessments" }}
      />
      <div className="grid max-w-2xl gap-6">
        {typeof submitted === "string" && own?.originalName === submitted ? (
          <Alert role="status">
            <CheckCircle2 />
            <AlertDescription>
              {own.state === "late"
                ? `${own.originalName} was submitted after the deadline and is marked late.`
                : `${own.originalName} was submitted.`}
            </AlertDescription>
          </Alert>
        ) : null}
        <Card role="region" aria-labelledby="your-submission">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span id="your-submission">Your submission</span> <SubmissionBadge state={assessment.submission.state} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {own ? (
              <div className="grid gap-1 text-sm">
                <a
                  href={`/api/submissions/${own.id}/file`}
                  className="inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:underline"
                >
                  <Download className="size-4 shrink-0" />
                  <span className="break-all">{own.originalName}</span>
                </a>
                <p className="text-muted-foreground">
                  {formatFileSize(own.sizeBytes)}, received {dateTime(own.submittedAt)}
                  {own.state === "late" ? ", after the deadline" : ""}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You have not submitted anything yet.</p>
            )}
          </CardContent>
        </Card>

        {upload.allowed ? (
          <Card>
            <CardHeader>
              <CardTitle>{own ? "Replace your submission" : "Submit your work"}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {upload.action === "create-late" ? (
                <Alert className="border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200">
                  <AlertTriangle />
                  <AlertTitle>The deadline has passed</AlertTitle>
                  <AlertDescription className="text-orange-900 dark:text-orange-200">
                    You can still submit, but your work will be marked late.
                  </AlertDescription>
                </Alert>
              ) : null}
              {upload.action === "replace" ? (
                <p className="text-sm text-muted-foreground">
                  You can replace your file until the deadline. Only your latest file is kept.
                </p>
              ) : null}
              <UploadForm assessmentId={id} replacing={upload.action === "replace"} />
            </CardContent>
          </Card>
        ) : (
          <Alert>
            <Info />
            <AlertTitle>{REFUSAL[upload.reason].title}</AlertTitle>
            <AlertDescription>{REFUSAL[upload.reason].body}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );
}
