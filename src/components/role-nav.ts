import type { Role } from "@/server/auth/types";
import type { NavItem } from "./nav-links";

/** The sidebar links and label for each role, shared by the role layouts and the change-password page. */
export const ROLE_NAV: Record<Role, { label: string; items: NavItem[] }> = {
  STAFF: {
    label: "Staff",
    items: [
      { href: "/staff/dashboard", label: "Dashboard", icon: "dashboard" },
      { href: "/staff/students", label: "Students", icon: "students" },
      { href: "/staff/assessments", label: "Assessments", icon: "assessments" },
      { href: "/staff/results", label: "Results", icon: "results" },
      { href: "/staff/programmes", label: "Programmes", icon: "programmes" },
    ],
  },
  STUDENT: {
    label: "Student",
    items: [
      { href: "/student/assessments", label: "Assessments", icon: "assessments" },
      { href: "/student/marksheet", label: "Marksheet", icon: "marksheet" },
      { href: "/student/fees", label: "Fees", icon: "fees" },
      { href: "/student/profile", label: "Profile", icon: "profile" },
    ],
  },
};
