import type { Metadata } from "next";
import { cardColour } from "@/components/card-colours";
import { PageHeader } from "@/components/page-header";
import { Pill } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
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
      <div className="grid gap-8 lg:grid-cols-2">
        {programmes.map((programme, position) => {
          const headingId = `programme-${programme.id}`;
          const count = programme.feePlan.length;
          const total = programme.feePlan.reduce((sum, instalment) => sum + instalment.amountMinor, 0);

          return (
            <article
              key={programme.id}
              aria-labelledby={headingId}
              className="rounded-2xl bg-card p-5 text-sm text-card-foreground ring-1 ring-foreground/10 sm:p-6"
            >
              <span
                className={cn(
                  "inline-block rounded-md px-1.5 py-0.5 font-mono text-xs font-medium",
                  cardColour(position).badge,
                )}
              >
                {programme.code}
              </span>
              <h2 id={headingId} className="mt-2 text-base font-semibold">
                {programme.name}
              </h2>
              <p className="mt-4 text-xs text-muted-foreground">Annual fee</p>
              <p className="text-2xl font-semibold tabular-nums">{money(programme.annualFeeMinor)}</p>

              <section aria-label={`${programme.name} fee plan`} className="mt-5 border-t pt-5">
                <h3 className="mb-2 text-sm font-medium">
                  Fee plan · {count} {count === 1 ? "instalment" : "instalments"}
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-xs text-muted-foreground">
                        <span aria-hidden>#</span>
                        <span className="sr-only">Instalment</span>
                      </TableHead>
                      <TableHead className="text-xs text-muted-foreground">Due each year on</TableHead>
                      <TableHead className="text-right text-xs text-muted-foreground">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programme.feePlan.map((instalment) => (
                      <TableRow key={instalment.sequence} className="hover:bg-transparent">
                        <TableCell>{instalment.sequence}</TableCell>
                        <TableCell>{dayAndMonth(instalment.dueDay, instalment.dueMonth)}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(instalment.amountMinor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="bg-transparent">
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell className="text-right tabular-nums">{money(total)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </section>

              <section aria-label={`${programme.name} modules`} className="mt-5 border-t pt-5">
                <h3 className="mb-3 text-sm font-medium">Modules</h3>
                <ul className="flex flex-wrap gap-2">
                  {programme.modules.map((item, index) => (
                    <li key={item.id} className="max-w-full">
                      <Pill
                        tone={index % 2 === 0 ? "blue" : "green"}
                        data-slot="module-pill"
                        className="max-w-full gap-1.5 px-2.5 py-1 whitespace-normal"
                      >
                        <span className="font-mono">{item.code}</span>
                        {item.title}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </section>
            </article>
          );
        })}
      </div>
    </>
  );
}
