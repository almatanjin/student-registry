import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireStaffPage } from "@/server/auth/pages";
import { NotFoundError } from "@/server/http/errors";
import { listProgrammeOptions } from "@/server/programmes/service";
import { getStudent, studentHasPayments } from "@/server/students/service";
import { StudentForm } from "../../student-form";

export const metadata: Metadata = { title: "Edit student · Student Registry" };

export default async function EditStudentPage({ params }: PageProps<"/staff/students/[id]/edit">) {
  await requireStaffPage();
  const { id } = await params;
  const student = await getStudent(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });
  const [programmes, billingLocked] = await Promise.all([listProgrammeOptions(), studentHasPayments(id)]);

  return (
    <>
      <PageHeader
        title={`Edit ${student.fullName}`}
        description={<span className="font-mono">{student.studentNumber}</span>}
        back={{ href: `/staff/students/${id}`, label: student.fullName }}
      />
      <StudentForm
        mode="edit"
        studentId={id}
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
