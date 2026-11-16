"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  ClipboardList,
  FileText,
  LayoutDashboard,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sidebarRowClass } from "./sidebar-styles";

/** Icons by name, because server layouts cannot pass icon components to this client component. */
const ICONS = {
  dashboard: LayoutDashboard,
  students: Users,
  assessments: ClipboardList,
  results: Award,
  programmes: BookOpen,
  marksheet: FileText,
  fees: Wallet,
  profile: User,
} satisfies Record<string, LucideIcon>;

export type NavIcon = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: NavIcon };

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main">
      <ul className="grid gap-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  sidebarRowClass,
                  active ? "bg-nav-active font-medium text-nav-active-foreground hover:bg-nav-active" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
