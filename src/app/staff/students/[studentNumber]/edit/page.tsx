import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireStaffPage } from "@/server/auth/pages";
import { NotFoundError } from "@/server/http/errors";
import { listProgrammeOptions } from "@/server/programmes/service";
import { getStudentByNumber, studentHasPayments } from "@/server/students/service";
import { StudentForm } from "../../student-form";

export const metadata: Metadata = { title: "Edit student · Student Registry" };

export default async function EditStudentPage({ params }: PageProps<"/staff/students/[studentNumber]/edit">) {
  await requireStaffPage();
  const { studentNumber } = await params;
  const student = await getStudentByNumber(studentNumber).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [programmes, billingLocked] = await Promise.all([listProgrammeOptions(), studentHasPayments(student.id)]);

  return (
    <>
      <PageHeader
        title={`Edit ${student.fullName}`}
        description={<span className="font-mono">{student.studentNumber}</span>}
        back={{ href: `/staff/students/${student.studentNumber}`, label: student.fullName }}
      />
      <StudentForm
        mode="edit"
        studentId={student.id}
        billingLocked={billingLocked}
        programmes={programmes}
        initial={{
          fullName: student.fullName,
          email: student.email,
          dateOfBirth: student.dateOfBirth,
          programmeId: student.programme.id,
          academicYear: student.academicYear,
          status: student.status,
        }}
      />
    </>
  );
}
