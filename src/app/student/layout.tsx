import { AppShell } from "@/components/app-shell";
import { ROLE_NAV } from "@/components/role-nav";
import { homeFor } from "@/domain/access";
import { requireStudentPage } from "@/server/auth/pages";

export default async function StudentLayout({ children }: LayoutProps<"/student">) {
  const user = await requireStudentPage();
  return (
    <AppShell
      homeHref={homeFor("STUDENT")}
      roleLabel={ROLE_NAV.STUDENT.label}
      nav={ROLE_NAV.STUDENT.items}
      email={user.email}
    >
      {children}
    </AppShell>
  );
}
