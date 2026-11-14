import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireStaffPage } from "@/server/auth/pages";
import { money } from "@/server/config";
import { listProgrammeDetails } from "@/server/programmes/service";

export const metadata: Metadata = { title: "Programmes · Student Registry" };

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** "1 October", without a year: plans apply to every academic year. */
function dayAndMonth(day: number, month: number) {
  return `${day} ${MONTH.format(new Date(Date.UTC(2000, month - 1, 1)))}`;
}

export default async function ProgrammesPage() {
  await requireStaffPage();
  const programmes = await listProgrammeDetails();

  return (
    <>
      <PageHeader
        title="Programmes"
        description="Fee plans and modules. New students are billed from their programme's plan for their academic year."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {programmes.map((programme) => (
          <Card key={programme.id}>
            <CardHeader>
              <CardTitle>{programme.name}</CardTitle>
              <CardDescription>
                <span className="font-mono">{programme.code}</span> · Annual fee {money(programme.annualFeeMinor)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <section aria-label={`${programme.name} fee plan`}>
                <h3 className="mb-2 text-sm font-medium">Fee plan</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instalment</TableHead>
                      <TableHead>Due each year on</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programme.feePlan.map((instalment) => (
                      <TableRow key={instalment.sequence}>
                        <TableCell>{instalment.sequence}</TableCell>
                        <TableCell>{dayAndMonth(instalment.dueDay, instalment.dueMonth)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(instalment.amountMinor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
              <section aria-label={`${programme.name} modules`}>
                <h3 className="mb-2 text-sm font-medium">Modules</h3>
                <ul className="grid gap-1 text-sm">
                  {programme.modules.map((item) => (
                    <li key={item.id}>
                      <span className="font-mono text-xs text-muted-foreground">{item.code}</span> {item.title}
                    </li>
                  ))}
                </ul>
              </section>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
