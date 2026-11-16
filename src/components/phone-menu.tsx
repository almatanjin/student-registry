"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The top bar and slide-out menu on narrow screens. The menu is a native modal dialog,
 * which supplies the backdrop, keeps focus inside, and closes on Escape.
 */
export function PhoneMenu({ brand, children }: { brand: React.ReactNode; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close after navigating, including when the browser's Back button changes the page.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-shell px-4 py-2.5 lg:hidden">
        {brand}
        <Button variant="outline" size="sm" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
          <Menu />
          Menu
        </Button>
      </div>
      <dialog
        ref={dialog}
        aria-label="Menu"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-r bg-shell p-0 text-foreground backdrop:bg-black/40 lg:hidden"
        onClick={(event) => {
          // A tap on the backdrop, or on any link inside, closes the menu.
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.closest("a")) dialog.current?.close();
        }}
      >
        <div className="relative flex h-full flex-col px-3 py-4">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Close menu"
            className="absolute top-4 right-3"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </Button>
          {children}
        </div>
      </dialog>
    </>
  );
}
