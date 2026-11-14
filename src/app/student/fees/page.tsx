import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { FeeSummary, InstalmentsCard, PaymentHistoryCard } from "@/components/fees";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDate } from "@/lib/format";
import { requireStudentPage } from "@/server/auth/pages";
import { money } from "@/server/config";
import { getStudentFees } from "@/server/fees/service";

export const metadata: Metadata = { title: "Fees · Student Registry" };

export default async function StudentFeesPage() {
  const user = await requireStudentPage();
  const fees = await getStudentFees(user.studentId);
  const overdueInstalment = fees.instalments.find((instalment) => instalment.state === "overdue");

  return (
    <>
      <PageHeader title="Your fees" description="Contact the Registry team with any questions about your fees." />
      <div className="grid gap-6">
        {overdueInstalment ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>{money(fees.overdueMinor)} is overdue</AlertTitle>
            <AlertDescription>
              The instalment due on {formatDate(overdueInstalment.dueDate)} has not been paid in full. Please pay it as
              soon as possible.
            </AlertDescription>
          </Alert>
        ) : null}
        <FeeSummary fees={fees} />
        <InstalmentsCard fees={fees} />
        <PaymentHistoryCard fees={fees} />
      </div>
    </>
  );
}
