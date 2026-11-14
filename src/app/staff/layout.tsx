import { AppShell } from "@/components/app-shell";
import { requireStaffPage } from "@/server/auth/pages";

const STAFF_NAV = [
  { href: "/staff/dashboard", label: "Dashboard" },
  { href: "/staff/students", label: "Students" },
  { href: "/staff/assessments", label: "Assessments" },
  { href: "/staff/results", label: "Results" },
  { href: "/staff/programmes", label: "Programmes" },
];

export default async function StaffLayout({ children }: LayoutProps<"/staff">) {
  const user = await requireStaffPage();
  return (
    <AppShell homeHref="/staff/dashboard" areaLabel="Staff" nav={STAFF_NAV} userLabel={user.email}>
      {children}
    </AppShell>
  );
}
