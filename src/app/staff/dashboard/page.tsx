import type { Metadata } from "next";
import Link from "next/link";
import { Award, Banknote, CheckCircle2, ClockAlert, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requireStaffPage } from "@/server/auth/pages";
import { money } from "@/server/config";
import { getDashboardSummary } from "@/server/dashboard/service";
import { listOverdueStudents } from "@/server/fees/overdue";
import { STATUS_LABELS } from "@/domain/schemas/student";

export const metadata: Metadata = { title: "Dashboard · Student Registry" };

export default async function StaffDashboardPage() {
  await requireStaffPage();
  const overdue = await listOverdueStudents();
  const summary = await getDashboardSummary(overdue);
  const totalOverdue = summary.overdue.totalMinor;
  const otherStatuses = summary.enrolled.others
    .map((row) => `${row.count} ${STATUS_LABELS[row.status].toLowerCase()}`)
    .join(", ");

  return (
    <>
      <PageHeader title="Registry dashboard" />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label="Enrolled students"
          value={String(summary.enrolled.count)}
          detail={otherStatuses || "No other statuses"}
          icon={Users}
          colour="blue"
          href="/staff/students?status=ENROLLED"
        />
        <StatTile
          label="Overdue balances"
          value={String(summary.overdue.count)}
          detail={summary.overdue.count > 0 ? `${money(totalOverdue)} overdue` : "Everyone is up to date"}
          icon={ClockAlert}
          colour="yellow"
          href="#overdue-balances"
        />
        <StatTile
          label="Fees collected"
          value={`${summary.fees.percent}%`}
          detail={
            summary.fees.billedMinor > 0
              ? `${money(summary.fees.paidMinor)} of ${money(summary.fees.billedMinor)} billed`
              : "No fees billed yet"
          }
          icon={Banknote}
          colour="green"
        />
        <StatTile
          label="Results to publish"
          value={String(summary.resultsToPublish)}
          detail="Complete, still pending"
          icon={Award}
          colour="purple"
          href="/staff/results"
        />
      </div>
      <Card id="overdue-balances" className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Overdue balances</CardTitle>
          <CardDescription>
            {overdue.length === 0
              ? "Every student is up to date with instalments that have fallen due."
              : `${overdue.length} ${overdue.length === 1 ? "student owes" : "students owe"} ${money(totalOverdue)} in instalments past their due date. Highest amount first.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdue.length === 0 ? (
            <p className="flex items-center gap-2 text-sm font-medium text-tone-green-foreground">
              <CheckCircle2 className="size-4" />
              No overdue balances
            </p>
          ) : (
            <Table aria-label="Overdue balances">
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden lg:table-cell">Programme</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Overdue</TableHead>
                  <TableHead className="hidden sm:table-cell">Unpaid since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="hidden font-mono text-xs sm:table-cell">{entry.studentNumber}</TableCell>
                    <TableCell>
                      <Link href={`/staff/students/${entry.id}/fees`} className="font-medium underline-offset-4 hover:underline">
                        {entry.fullName}
                      </Link>
                      <div className="text-xs whitespace-normal text-muted-foreground lg:hidden">
                        <span className="font-mono sm:hidden">{entry.studentNumber} · </span>
                        {entry.programmeName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{entry.programmeName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium text-tone-red-foreground tabular-nums">
                      {money(entry.overdueMinor)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(entry.earliestUnpaidDueDate)}</TableCell>
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
