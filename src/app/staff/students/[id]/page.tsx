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
import { getStudent } from "@/server/students/service";

export const metadata: Metadata = { title: "Student · Student Registry" };

export default async function StudentPage({ params }: PageProps<"/staff/students/[id]">) {
  await requireStaffPage();
  const { id } = await params;
  const student = await getStudent(id).catch((error) => {
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
              <Link href={`/staff/students/${id}/fees`}>
                <Wallet />
                Fees and payments
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/staff/students/${id}/edit`}>
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
    </>
  );
}
