import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Wallet } from "lucide-react";
import { DetailList } from "@/components/details";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { requireStaffPage } from "@/server/auth/pages";
import { NotFoundError } from "@/server/http/errors";
import { getStudentByNumber } from "@/server/students/service";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Student · Student Registry" };

export default async function StudentPage({ params }: PageProps<"/staff/students/[studentNumber]">) {
  await requireStaffPage();
  const { studentNumber } = await params;
  const student = await getStudentByNumber(studentNumber).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <>
      <PageHeader
        title={student.fullName}
        description={
          <span className="flex items-center gap-2">
            <span className="font-mono">{student.studentNumber}</span>
            <StatusBadge status={student.status} />
          </span>
        }
        back={{ href: "/staff/students", label: "Students" }}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/staff/students/${student.studentNumber}/fees`}>
                <Wallet />
                Fees and payments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/staff/students/${student.studentNumber}/edit`}>
                <Pencil />
                Edit
              </Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Student record</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Student ID", value: <span className="font-mono">{student.studentNumber}</span> },
              { label: "Full name", value: student.fullName },
              { label: "Email", value: student.email },
              { label: "Date of birth", value: formatDate(student.dateOfBirth) },
              { label: "Programme", value: student.programme.name },
              { label: "Academic year", value: student.academicYear },
              { label: "Enrolment status", value: <StatusBadge status={student.status} /> },
            ]}
          />
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Sign-in</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            If the student has forgotten their password, set a temporary one. They must change it when they next sign in.
          </p>
          <ResetPasswordForm studentId={student.id} />
        </CardContent>
      </Card>
    </>
  );
}
