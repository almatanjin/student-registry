import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { ClassificationBadge, ResultStateBadge } from "@/components/result-badges";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/server/auth/pages";
import { NotFoundError } from "@/server/http/errors";
import { getModuleResults } from "@/server/results/service";
import { PublishAllButton, RowActions } from "./result-actions";

export const metadata: Metadata = { title: "Module results · Student Registry" };

export default async function ModuleResultsPage({ params }: PageProps<"/staff/results/[moduleId]">) {
  await requireStaffPage();
  const { moduleId } = await params;
  const view = await getModuleResults(moduleId).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={`${view.module.code} ${view.module.title}`}
        description={`${view.module.programmeName}. Results can be published once every assessment has a grade. Withheld results are skipped by "Publish all".`}
        back={{ href: "/staff/results", label: "Results" }}
        actions={view.assessments.length > 0 ? <PublishAllButton moduleId={moduleId} /> : null}
      />
      <Card>
        <CardContent>
          {view.assessments.length === 0 ? (
            <p className="text-sm text-muted-foreground">This module has no assessments yet, so there is nothing to publish.</p>
          ) : (
            <Table aria-label="Module results">
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  {view.assessments.map((assessment) => (
                    <TableHead key={assessment.id} className="hidden md:table-cell">
                      <Link href={`/staff/assessments/${assessment.id}`} className="underline-offset-4 hover:underline">
                        {assessment.title}
                      </Link>
                    </TableHead>
                  ))}
                  <TableHead>Result</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.rows.map((row) => (
                  <TableRow key={row.student.id}>
                    <TableCell className="align-top whitespace-normal">
                      <span className="font-medium">{row.student.fullName}</span>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-mono">{row.student.studentNumber}</span>
                        {row.student.status !== "ENROLLED" ? <StatusBadge status={row.student.status} /> : null}
                      </div>
                    </TableCell>
                    {view.assessments.map((assessment) => {
                      const grade = row.grades[assessment.id];
                      return (
                        <TableCell key={assessment.id} className="hidden align-top md:table-cell">
                          {grade ? (
                            <span className="flex items-center gap-1.5 tabular-nums">
                              {grade.value} <ClassificationBadge classification={grade.classification} />
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">No grade</span>
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="align-top whitespace-normal">
                      <ResultStateBadge state={row.state} />
                      {row.missing.length > 0 ? (
                        <p className="mt-1 text-xs text-muted-foreground">Missing: {row.missing.join(", ")}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top">
                      <RowActions
                        studentId={row.student.id}
                        moduleId={moduleId}
                        studentName={row.student.fullName}
                        state={row.state}
                        complete={row.missing.length === 0}
                      />
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
