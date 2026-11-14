import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { academicYearOf, formatAcademicYear } from "@/domain/academic-year";
import { requireStaffPage } from "@/server/auth/pages";
import { today } from "@/server/config";
import { listProgrammeOptions } from "@/server/programmes/service";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Add student · Student Registry" };

export default async function NewStudentPage() {
  await requireStaffPage();
  const programmes = await listProgrammeOptions();

  return (
    <>
      <PageHeader
        title="Add student"
        description="The Student ID is generated when the record is created."
        back={{ href: "/staff/students", label: "Students" }}
      />
      <StudentForm
        mode="create"
        programmes={programmes}
        initial={{
          fullName: "",
          email: "",
          dateOfBirth: "",
          programmeId: "",
          academicYear: formatAcademicYear(academicYearOf(today())),
          status: "ENROLLED",
        }}
      />
    </>
  );
}
