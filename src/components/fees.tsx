import { AlertTriangle } from "lucide-react";
import { Pill } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InstalmentState } from "@/domain/fees";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { money } from "@/server/config";
import type { FeesView } from "@/server/fees/service";

const STATE: Record<InstalmentState, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-emerald-50 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300" },
  overdue: { label: "Overdue", className: "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950 dark:text-red-300" },
  upcoming: { label: "Upcoming", className: "bg-zinc-100 text-zinc-700 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300" },
};

export function InstalmentStateBadge({ state }: { state: InstalmentState }) {
  return <Pill className={STATE[state].className}>{STATE[state].label}</Pill>;
}

export function OverdueBadge() {
  return <Pill className={STATE.overdue.className}>Overdue</Pill>;
}

/** Total, paid, outstanding, and overdue amounts, with the overdue amount highlighted when above zero. */
export function FeeSummary({ fees }: { fees: FeesView }) {
  const items = [
    { label: "Total fee", value: fees.totalMinor },
    { label: "Paid", value: fees.paidMinor },
    { label: "Outstanding", value: fees.outstandingMinor },
  ];
  const overdue = fees.overdueMinor > 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} role="group" aria-label={item.label} className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{item.label}</p>
          <p className="mt-1 text-xl font-semibold tabular-nums">{money(item.value)}</p>
        </div>
      ))}
      <div
        className={cn(
          "rounded-lg border p-4",
          overdue && "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-200",
        )}
        role="group"
        aria-label="Overdue"
      >
        <p className={cn("flex items-center gap-1.5 text-sm", overdue ? "font-medium" : "text-muted-foreground")}>
          {overdue ? <AlertTriangle className="size-4" /> : null}
          Overdue
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums">{money(fees.overdueMinor)}</p>
        {overdue && fees.earliestUnpaidDueDate ? (
          <p className="mt-1 text-xs">Unpaid since {formatDate(fees.earliestUnpaidDueDate)}</p>
        ) : null}
      </div>
    </div>
  );
}

export function InstalmentsCard({ fees }: { fees: FeesView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Instalments</CardTitle>
        <CardDescription>Payments cover instalments in due-date order. An instalment is overdue the day after its due date.</CardDescription>
      </CardHeader>
      <CardContent>
        {fees.instalments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fee has been billed.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Still owed</TableHead>
                <TableHead>State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.instalments.map((instalment) => (
                <TableRow
                  key={instalment.sequence}
                  className={cn(instalment.state === "overdue" && "bg-red-50/60 dark:bg-red-950/40")}
                >
                  <TableCell>{formatDate(instalment.dueDate)}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(instalment.amountMinor)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {money(instalment.remainingMinor)}
                  </TableCell>
                  <TableCell>
                    <InstalmentStateBadge state={instalment.state} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export function PaymentHistoryCard({ fees }: { fees: FeesView }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment history</CardTitle>
        <CardDescription>Newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        {fees.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paidOn)}</TableCell>
                  <TableCell className="font-mono text-xs">{payment.reference}</TableCell>
                  <TableCell className="text-right tabular-nums">{money(payment.amountMinor)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
