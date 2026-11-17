import type { Metadata } from "next";
import { ModuleResultCard } from "@/components/module-result-card";
import { PageHeader } from "@/components/page-header";
import { requireStaffPage } from "@/server/auth/pages";
import { listModuleResultSummaries } from "@/server/results/service";

export const metadata: Metadata = { title: "Results · Student Registry" };

export default async function ResultsPage() {
  await requireStaffPage();
  const summaries = await listModuleResultSummaries();

  return (
    <>
      <PageHeader
        title="Results"
        description="Publish or withhold each student's results module by module. Students only see published results."
      />
      <ul className="grid gap-4 md:grid-cols-2" aria-label="Modules">
        {summaries.map((summary, position) => (
          <li key={summary.id}>
            <ModuleResultCard summary={summary} position={position} />
          </li>
        ))}
      </ul>
    </>
  );
}
