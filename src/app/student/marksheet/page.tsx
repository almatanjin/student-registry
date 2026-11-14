import type { Metadata } from "next";
import { Clock } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { ClassificationBadge } from "@/components/result-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStudentPage } from "@/server/auth/pages";
import { getStudentResults } from "@/server/results/service";

export const metadata: Metadata = { title: "Marksheet · Student Registry" };

export default async function MarksheetPage() {
  const user = await requireStudentPage();
  const modules = await getStudentResults(user.studentId);

  return (
    <>
      <PageHeader
        title="Your marksheet"
        description="Results appear here once they have been released. Pass is 40 or above, Merit 60 or above, and Distinction 70 or above."
      />
      {modules.length === 0 ? (
        <EmptyState title="No modules yet" />
      ) : (
        <div className="grid gap-4">
          {modules.map((module_) => (
            <Card key={module_.moduleId} role="region" aria-labelledby={`module-${module_.moduleId}`}>
              <CardHeader>
                <CardTitle id={`module-${module_.moduleId}`}>
                  <span className="font-mono text-sm text-muted-foreground">{module_.code}</span> {module_.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {module_.released ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assessment</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                        <TableHead>Classification</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {module_.assessments.map((assessment) => (
                        <TableRow key={assessment.title}>
                          <TableCell className="whitespace-normal">{assessment.title}</TableCell>
                          <TableCell className="text-right font-medium tabular-nums">{assessment.grade}</TableCell>
                          <TableCell>
                            <ClassificationBadge classification={assessment.classification} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="size-4" />
                    Results not yet released
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
