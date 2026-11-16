/**
 * Shared look for sidebar rows: navigation links and the account actions in the footer.
 * Kept in a plain module so both the client navigation and the server-rendered footer can import it.
 */
export const sidebarRowClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-nav-active/60 hover:text-foreground [&_svg]:size-[18px] [&_svg]:shrink-0";
