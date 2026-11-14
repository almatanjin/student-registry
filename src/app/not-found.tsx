import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Shown for unknown pages and for records that do not exist or belong to someone else. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page does not exist, or you do not have access to it.
      </p>
      <Button asChild className="mt-2">
        {/* "/" sends each person on to their own home page. */}
        <Link href="/">Back to the registry</Link>
      </Button>
    </main>
  );
}
