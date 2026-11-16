import { AppShell } from "@/components/app-shell";
import { ROLE_NAV } from "@/components/role-nav";
import { homeFor } from "@/domain/access";
import { requireStaffPage } from "@/server/auth/pages";

export default async function StaffLayout({ children }: LayoutProps<"/staff">) {
  const user = await requireStaffPage();
  return (
    <AppShell homeHref={homeFor("STAFF")} roleLabel={ROLE_NAV.STAFF.label} nav={ROLE_NAV.STAFF.items} email={user.email}>
      {children}
    </AppShell>
  );
}
