import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENROLMENT_STATUSES, STATUS_LABELS, studentListQuerySchema } from "@/domain/schemas/student";
import { requireStaffPage } from "@/server/auth/pages";
import { listProgrammeOptions } from "@/server/programmes/service";
import { listStudents } from "@/server/students/service";

export const metadata: Metadata = { title: "Students · Student Registry" };

export default async function StudentsPage({ searchParams }: PageProps<"/staff/students">) {
  await requireStaffPage();
  const raw = await searchParams;
  const parsed = studentListQuerySchema.safeParse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    programmeId: typeof raw.programmeId === "string" ? raw.programmeId : undefined,
    status: typeof raw.status === "string" ? raw.status : undefined,
  });
  // An unknown filter value in a hand-edited URL just shows the unfiltered list.
  const filters = parsed.success ? parsed.data : { q: undefined, programmeId: undefined, status: undefined };
  const filtered = Boolean(filters.q || filters.programmeId || filters.status);

  const [students, programmes] = await Promise.all([listStudents(filters), listProgrammeOptions()]);

  return (
    <>
      <PageHeader
        title="Students"
        description={`${students.length} ${students.length === 1 ? "student" : "students"}${filtered ? " match these filters" : ""}`}
        actions={
          <Button asChild>
            <Link href="/staff/students/new">
              <Plus />
              Add student
            </Link>
          </Button>
        }
      />

      <form method="get" role="search" className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="q">Search</Label>
          <Input id="q" name="q" type="search" placeholder="Name or Student ID" defaultValue={filters.q ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="programmeId">Programme</Label>
          <NativeSelect id="programmeId" name="programmeId" defaultValue={filters.programmeId ?? ""} className="w-full sm:w-56">
            <NativeSelectOption value="">All programmes</NativeSelectOption>
            {programmes.map((programme) => (
              <NativeSelectOption key={programme.id} value={programme.id}>
                {programme.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="status">Status</Label>
          <NativeSelect id="status" name="status" defaultValue={filters.status ?? ""} className="w-full sm:w-40">
            <NativeSelectOption value="">All statuses</NativeSelectOption>
            {ENROLMENT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {STATUS_LABELS[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex gap-2">
          <Button type="submit">
            <Search />
            Search
          </Button>
          {filtered ? (
            <Button variant="ghost" asChild>
              <Link href="/staff/students">Clear filters</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {students.length === 0 ? (
        <EmptyState title={filtered ? "No students match these filters" : "No students yet"}>
          {filtered ? (
            <Link href="/staff/students" className="font-medium text-foreground underline underline-offset-4">
              Clear filters
            </Link>
          ) : (
            "Add the first student to get started."
          )}
        </EmptyState>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden sm:table-cell">Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Programme</TableHead>
                <TableHead className="hidden sm:table-cell">Academic year</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">
                    <Link href={`/staff/students/${student.id}`} className="underline-offset-4 hover:underline">
                      {student.studentNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/staff/students/${student.id}`} className="font-medium underline-offset-4 hover:underline">
                      {student.fullName}
                    </Link>
                    <div className="text-xs whitespace-normal text-muted-foreground md:hidden">
                      <span className="font-mono sm:hidden">{student.studentNumber} · </span>
                      {student.programme.name}
                      <span className="sm:hidden"> · {student.academicYear}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{student.programme.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">{student.academicYear}</TableCell>
                  <TableCell>
                    <StatusBadge status={student.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
