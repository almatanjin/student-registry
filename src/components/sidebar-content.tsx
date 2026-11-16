import Image from "next/image";
import Link from "next/link";
import { KeyRound, LogOut } from "lucide-react";
import { signOutAction } from "@/app/sign-in/actions";
import { CHANGE_PASSWORD_PATH } from "@/domain/access";
import { cn } from "@/lib/utils";
import { NavLinks, type NavItem } from "./nav-links";
import { sidebarRowClass } from "./sidebar-styles";

export type SidebarProps = {
  homeHref: string;
  /** "Staff" or "Student". */
  roleLabel: string;
  nav: NavItem[];
  email: string;
};

/** The PEN mark beside "Student Registry" and the role, linking home. Used in the sidebar and the phone top bar. */
export function Brand({ homeHref, roleLabel, size = 34 }: { homeHref: string; roleLabel?: string; size?: number }) {
  return (
    <Link href={homeHref} className="flex items-center gap-2.5 rounded-lg">
      {/* Decorative: the name is written next to the mark. */}
      <Image src="/pen-mark.svg" alt="" width={size} height={size} unoptimized />
      <span className="grid leading-tight">
        <span className="text-[15px] font-semibold text-foreground">Student Registry</span>
        {roleLabel ? <span className="text-xs text-muted-foreground">{roleLabel}</span> : null}
      </span>
    </Link>
  );
}

/** Everything inside the sidebar: brand, the role's links, and the signed-in footer. Shared by desktop and the phone menu. */
export function SidebarContent({ homeHref, roleLabel, nav, email }: SidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-6 px-1">
        <Brand homeHref={homeHref} roleLabel={roleLabel} />
      </div>
      <NavLinks items={nav} />
      <div className="mt-auto grid min-w-0 gap-0.5 border-t pt-3">
        <div className="flex min-w-0 items-center gap-2.5 px-2.5 pb-2">
          <span
            aria-hidden
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-tile-blue text-sm font-semibold text-nav-active-foreground"
          >
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="grid min-w-0">
            <span className="truncate text-sm text-foreground" title={email}>
              {email}
            </span>
            <span className="text-xs text-muted-foreground">Signed in as {roleLabel.toLowerCase()}</span>
          </span>
        </div>
        <Link href={CHANGE_PASSWORD_PATH} className={cn(sidebarRowClass, "text-muted-foreground")}>
          <KeyRound aria-hidden />
          Change password
        </Link>
        <form action={signOutAction}>
          <button type="submit" className={cn(sidebarRowClass, "text-muted-foreground")}>
            <LogOut aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
