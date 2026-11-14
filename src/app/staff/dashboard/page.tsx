import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { requireStaffPage } from "@/server/auth/pages";
import { money } from "@/server/config";
import { listOverdueStudents } from "@/server/fees/overdue";

export const metadata: Metadata = { title: "Dashboard · Student Registry" };

export default async function StaffDashboardPage() {
  await requireStaffPage();
  const overdue = await listOverdueStudents();
  const totalOverdue = overdue.reduce((sum, entry) => sum + entry.overdueMinor, 0);

  return (
    <>
      <PageHeader title="Registry dashboard" />
      <Card>
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
            <p className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
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
                    <TableCell className="text-right font-medium text-red-700 tabular-nums dark:text-red-400">
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
