import { PhoneMenu } from "./phone-menu";
import { Brand, SidebarContent, type SidebarProps } from "./sidebar-content";

type AppShellProps = SidebarProps & { children: React.ReactNode };

/**
 * The signed-in layout: a sidebar that stays in view on wide screens, and the page beside it.
 * On narrow screens a top bar with a "Menu" button opens the same sidebar content.
 */
export function AppShell({ children, ...sidebar }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside
        aria-label="Sidebar"
        className="sticky top-0 hidden h-screen flex-col overflow-y-auto border-r bg-shell px-3 py-4 lg:flex"
      >
        <SidebarContent {...sidebar} />
      </aside>
      <div className="flex min-w-0 flex-col">
        <PhoneMenu brand={<Brand homeHref={sidebar.homeHref} size={28} />}>
          <SidebarContent {...sidebar} />
        </PhoneMenu>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
