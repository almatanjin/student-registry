import { AlertTriangle } from "lucide-react";
import { Pill, type Tone } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { InstalmentState } from "@/domain/fees";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { money } from "@/server/config";
import type { FeesView } from "@/server/fees/service";

const STATE: Record<InstalmentState, { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "green" },
  overdue: { label: "Overdue", tone: "red" },
  upcoming: { label: "Upcoming", tone: "sky" },
};

export function InstalmentStateBadge({ state }: { state: InstalmentState }) {
  return <Pill tone={STATE[state].tone}>{STATE[state].label}</Pill>;
}

export function OverdueBadge() {
  return <Pill tone={STATE.overdue.tone}>Overdue</Pill>;
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
          overdue && "border-tone-red-foreground/20 bg-tone-red text-tone-red-foreground",
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
                  className={cn(instalment.state === "overdue" && "bg-tone-red/60")}
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
                <TableHead className="hidden sm:table-cell">Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    {formatDate(payment.paidOn)}
                    {/* On phones the reference sits under the date, so the amount stays in view. */}
                    <div className="font-mono text-xs text-muted-foreground sm:hidden">{payment.reference}</div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">{payment.reference}</TableCell>
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
