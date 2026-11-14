import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaffPage } from "@/server/auth/pages";
import { listModulesWithProgramme } from "@/server/results/service";

export const metadata: Metadata = { title: "Results · Student Registry" };

export default async function ResultsPage() {
  await requireStaffPage();
  const modules = await listModulesWithProgramme();

  return (
    <>
      <PageHeader
        title="Results"
        description="Publish or withhold each student's results module by module. Students only see published results."
      />
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Modules">
        {modules.map((item) => (
          <li key={item.id}>
            <Link
              href={`/staff/results/${item.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  <span className="font-mono text-sm text-muted-foreground">{item.code}</span> {item.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.programme.name} · {item._count.assessments}{" "}
                  {item._count.assessments === 1 ? "assessment" : "assessments"}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
