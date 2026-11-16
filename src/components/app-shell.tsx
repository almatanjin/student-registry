import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { signOutAction } from "@/app/sign-in/actions";
import { Button } from "@/components/ui/button";
import { CHANGE_PASSWORD_PATH } from "@/domain/access";
import { NavLinks, type NavItem } from "./nav-links";

type AppShellProps = {
  homeHref: string;
  areaLabel: string;
  nav: NavItem[];
  userLabel: string;
  children: React.ReactNode;
};

export function AppShell({ homeHref, areaLabel, nav, userLabel, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href={homeHref} className="flex items-baseline gap-2 font-semibold">
            Student Registry
            <span className="text-xs font-normal text-muted-foreground">{areaLabel}</span>
          </Link>
          <NavLinks items={nav} />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{userLabel}</span>
            <Button variant="ghost" size="sm" asChild>
              <Link href={CHANGE_PASSWORD_PATH}>
                <KeyRound />
                Change password
              </Link>
            </Button>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut />
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
