import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { OpenBadge } from "@/components/assessment-badges";
import { EmptyState, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAssessmentsForStaff } from "@/server/assessments/service";
import { requireStaffPage } from "@/server/auth/pages";
import { dateTime } from "@/server/config";

export const metadata: Metadata = { title: "Assessments · Student Registry" };

export default async function StaffAssessmentsPage() {
  await requireStaffPage();
  const assessments = await listAssessmentsForStaff();

  return (
    <>
      <PageHeader
        title="Assessments"
        description="Earliest deadline first."
        actions={
          <Button asChild>
            <Link href="/staff/assessments/new">
              <Plus />
              New assessment
            </Link>
          </Button>
        }
      />
      {assessments.length === 0 ? (
        <EmptyState title="No assessments yet">Create the first assessment for a module.</EmptyState>
      ) : (
        <div className="rounded-lg border">
          <Table aria-label="Assessments">
            <TableHeader>
              <TableRow>
                <TableHead>Assessment</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="hidden text-right sm:table-cell">On time</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Late</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Missing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => {
                return (
                  <TableRow key={assessment.id}>
                    <TableCell className="whitespace-normal">
                      <Link href={`/staff/assessments/${assessment.id}`} className="font-medium underline-offset-4 hover:underline">
                        {assessment.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-mono">{assessment.module.code}</span> {assessment.module.title}
                        <span className="md:hidden"> · due {dateTime(assessment.deadline)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {dateTime(assessment.deadline)}
                      {assessment.deadlinePassed ? <div className="text-xs text-muted-foreground">Deadline passed</div> : null}
                    </TableCell>
                    <TableCell>
                      <OpenBadge isOpen={assessment.isOpen} />
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{assessment.counts.onTime}</TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      <span className={assessment.counts.late > 0 ? "font-medium text-tone-yellow-foreground" : undefined}>
                        {assessment.counts.late}
                      </span>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">{assessment.counts.missing}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
