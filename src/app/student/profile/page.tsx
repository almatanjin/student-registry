import type { Metadata } from "next";
import { DetailList } from "@/components/details";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { requireStudentPage } from "@/server/auth/pages";
import { getStudent } from "@/server/students/service";

export const metadata: Metadata = { title: "Profile · Student Registry" };

export default async function StudentProfilePage() {
  const user = await requireStudentPage();
  const student = await getStudent(user.studentId);

  return (
    <>
      <PageHeader
        title="Your profile"
        description="Contact the Registry team if any of these details are wrong."
      />
      <Card>
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
