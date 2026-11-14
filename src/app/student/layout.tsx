import { AppShell } from "@/components/app-shell";
import { requireStudentPage } from "@/server/auth/pages";

const STUDENT_NAV = [
  { href: "/student/assessments", label: "Assessments" },
  { href: "/student/marksheet", label: "Marksheet" },
  { href: "/student/fees", label: "Fees" },
  { href: "/student/profile", label: "Profile" },
];

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireStudentPage();
  return (
    <AppShell homeHref="/student/assessments" areaLabel="Student" nav={STUDENT_NAV} userLabel={user.email}>
      {children}
    </AppShell>
  );
}
