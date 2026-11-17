import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { cardColour } from "@/components/card-colours";
import { GradeBandsLegend } from "@/components/grade-bands-legend";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ClassificationBadge } from "@/components/result-badges";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { requireStudentPage } from "@/server/auth/pages";
import { getStudentResults, type StudentModuleResults } from "@/server/results/service";

export const metadata: Metadata = { title: "Marksheet · Student Registry" };

export default async function MarksheetPage() {
  const user = await requireStudentPage();
  const modules = await getStudentResults(user.studentId);

  if (modules.length === 0) {
    return (
      <>
        <PageHeader title="Your marksheet" />
        <EmptyState title="No modules yet" />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Your marksheet" description={<GradeBandsLegend />} />
      <div className="rounded-xl border bg-card px-3 py-1 md:px-4">
        <Table aria-label="Your marksheet" className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="hidden w-[34%] text-xs text-muted-foreground md:table-cell">Module</TableHead>
              <TableHead className="text-xs text-muted-foreground">Assessment</TableHead>
              <TableHead className="w-14 text-right text-xs text-muted-foreground">Grade</TableHead>
              <TableHead className="w-28 text-xs text-muted-foreground">Classification</TableHead>
            </TableRow>
          </TableHeader>
          {modules.map((module_, position) => (
            <ModuleRows key={module_.moduleId} module_={module_} position={position} />
          ))}
        </Table>
      </div>
    </>
  );
}

/**
 * One module's rows. From `md` up, a Module cell spans the module's rows; on phones that cell is hidden
 * and a heading row above the rows names the module instead.
 */
function ModuleRows({ module_, position }: { module_: StudentModuleResults; position: number }) {
  const badge = (
    <span className={cn("rounded-md px-1.5 py-0.5 font-mono text-xs font-medium", cardColour(position).badge)}>
      {module_.code}
    </span>
  );
  const rowCount = module_.released ? Math.max(module_.assessments.length, 1) : 1;
  const moduleCell = (
    <TableHead
      scope="rowgroup"
      rowSpan={rowCount}
      className="hidden h-auto py-3 pr-4 align-top font-normal whitespace-normal md:table-cell"
    >
      {badge}
      <span className="mt-1.5 block text-sm">{module_.title}</span>
    </TableHead>
  );

  return (
    <TableBody aria-label={`${module_.code} ${module_.title}`} className="border-t first:border-t-0">
      <TableRow className="bg-muted/40 hover:bg-muted/40 md:hidden">
        <TableHead scope="rowgroup" colSpan={3} className="h-auto py-2.5 font-normal whitespace-normal">
          {badge} <span className="ml-1 text-sm">{module_.title}</span>
        </TableHead>
      </TableRow>
      {module_.released && module_.assessments.length > 0 ? (
        module_.assessments.map((assessment, index) => (
          <TableRow key={assessment.title} className="hover:bg-transparent">
            {index === 0 ? moduleCell : null}
            <TableCell className="whitespace-normal">{assessment.title}</TableCell>
            <TableCell className="text-right font-medium tabular-nums">{assessment.grade}</TableCell>
            <TableCell>
              <ClassificationBadge classification={assessment.classification} />
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow className="hover:bg-transparent">
          {moduleCell}
          <TableCell colSpan={3} className="text-muted-foreground">
            <span className="flex items-center gap-2">
              <Clock aria-hidden className="size-4 shrink-0" />
              Results not yet released
            </span>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  );
}
