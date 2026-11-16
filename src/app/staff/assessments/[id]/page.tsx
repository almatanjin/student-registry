import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, Pencil } from "lucide-react";
import { formatFileSize, OpenBadge, SubmissionBadge } from "@/components/assessment-badges";
import { PageHeader } from "@/components/page-header";
import { ClassificationBadge, ResultStateBadge } from "@/components/result-badges";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getAssessmentMarksheet } from "@/server/results/service";
import { requireStaffPage } from "@/server/auth/pages";
import { dateTime } from "@/server/config";
import { NotFoundError } from "@/server/http/errors";
import { GradeCell } from "./grade-cell";
import { OpenToggle } from "./open-toggle";

export const metadata: Metadata = { title: "Assessment · Student Registry" };

export default async function StaffAssessmentPage({ params }: PageProps<"/staff/assessments/[id]">) {
  await requireStaffPage();
  const { id } = await params;
  const { assessment, rows } = await getAssessmentMarksheet(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const late = rows.filter((row) => row.submission?.state === "late").length;
  const onTime = rows.filter((row) => row.submission?.state === "on-time").length;
  const missing = rows.length - late - onTime;

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
            <span>
              Deadline {dateTime(assessment.deadline)}
              {assessment.deadlinePassed ? " (passed)" : ""}
            </span>
            <OpenBadge isOpen={assessment.isOpen} />
          </span>
        }
        back={{ href: "/staff/assessments", label: "Assessments" }}
        actions={
          <>
            <OpenToggle assessmentId={id} isOpen={assessment.isOpen} />
            <Button variant="outline" asChild>
              <Link href={`/staff/assessments/${id}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:max-w-md">
        {[
          { label: "On time", value: onTime },
          { label: "Late", value: late, highlight: late > 0 },
          { label: "Missing", value: missing },
        ].map((item) => (
          <div
            key={item.label}
            role="group"
            aria-label={item.label}
            className={cn(
              "rounded-lg border p-3",
              item.highlight && "border-tone-yellow-foreground/20 bg-tone-yellow text-tone-yellow-foreground",
            )}
          >
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="text-xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions and marks</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter a whole number from 0 to 100. Students see their marks once their module results are published.{" "}
            <Link href={`/staff/results/${assessment.module.id}`} className="font-medium text-foreground underline underline-offset-4">
              Manage {assessment.module.code} results
            </Link>
          </p>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students are on this programme yet.</p>
          ) : (
            <Table aria-label="Submissions">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden sm:table-cell">Submission</TableHead>
                  <TableHead className="hidden md:table-cell">Received</TableHead>
                  <TableHead className="hidden sm:table-cell">File</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ student, submission, grade, resultState }) => (
                  <TableRow
                    key={student.id}
                    className={cn(submission?.state === "late" && "bg-tone-yellow/60")}
                  >
                    <TableCell className="whitespace-normal">
                      <span className="font-medium">{student.fullName}</span>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono">{student.studentNumber}</span>
                        {student.status !== "ENROLLED" ? <StatusBadge status={student.status} /> : null}
                        <span className="sm:hidden">
                          <SubmissionBadge state={submission?.state ?? "missing"} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <SubmissionBadge state={submission?.state ?? "missing"} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{submission ? dateTime(submission.submittedAt) : ""}</TableCell>
                    <TableCell className="hidden whitespace-normal sm:table-cell">
                      {submission ? (
                        <a
                          href={`/api/submissions/${submission.id}/file`}
                          className="inline-flex items-center gap-1.5 text-sm underline-offset-4 hover:underline"
                        >
                          <Download className="size-4 shrink-0" />
                          <span className="break-all">{submission.originalName}</span>
                          <span className="text-xs text-muted-foreground">({formatFileSize(submission.sizeBytes)})</span>
                        </a>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <GradeCell
                        assessmentId={id}
                        studentId={student.id}
                        studentName={student.fullName}
                        initial={grade?.value ?? null}
                        published={resultState === "PUBLISHED"}
                      />
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {grade ? <ClassificationBadge classification={grade.classification} /> : null}
                        {resultState !== "PENDING" ? <ResultStateBadge state={resultState} /> : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
