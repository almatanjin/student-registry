import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FeeSummary, InstalmentsCard, PaymentHistoryCard } from "@/components/fees";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireStaffPage } from "@/server/auth/pages";
import { money, today } from "@/server/config";
import { getStudentFees } from "@/server/fees/service";
import { NotFoundError } from "@/server/http/errors";
import { getStudent } from "@/server/students/service";
import { PaymentForm } from "./payment-form";

export const metadata: Metadata = { title: "Fees · Student Registry" };

export default async function StudentFeesPage({ params }: PageProps<"/staff/students/[id]/fees">) {
  await requireStaffPage();
  const { id } = await params;
  const [student, fees] = await Promise.all([getStudent(id), getStudentFees(id)]).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={`Fees: ${student.fullName}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{student.studentNumber}</span>
            <span>·</span>
            <span>
              {student.programme.name}, {student.academicYear}
            </span>
            <StatusBadge status={student.status} />
          </span>
        }
        back={{ href: `/staff/students/${id}`, label: student.fullName }}
      />
      <div className="grid gap-6">
        <FeeSummary fees={fees} />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="grid content-start gap-6">
            <InstalmentsCard fees={fees} />
            <PaymentHistoryCard fees={fees} />
          </div>
          <Card className="content-start self-start">
            <CardHeader>
              <CardTitle>Record a payment</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                studentId={id}
                today={today()}
                outstanding={money(fees.outstandingMinor)}
                disabled={fees.outstandingMinor === 0}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
