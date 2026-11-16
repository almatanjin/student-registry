"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ENROLMENT_STATUSES, STATUS_LABELS } from "@/domain/schemas/student";

const SEARCH_DELAY_MS = 300;

type Filters = { q: string; programmeId: string; status: string };

function toQueryString(filters: Filters) {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q) params.set("q", q);
  if (filters.programmeId) params.set("programmeId", filters.programmeId);
  if (filters.status) params.set("status", filters.status);
  return params.toString();
}

function fromSearchParams(params: URLSearchParams): Filters {
  return {
    q: params.get("q") ?? "",
    programmeId: params.get("programmeId") ?? "",
    status: params.get("status") ?? "",
  };
}

/**
 * Search box and filters for the student list. Typing updates the URL after a
 * short pause and a filter change updates it at once; the server page then
 * renders the matching students from the query string.
 */
export function StudentFilters({ programmes }: { programmes: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState(() => fromSearchParams(searchParams));
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // The query string this component last navigated to, so a URL change it made
  // itself does not overwrite text the user has typed since.
  const lastApplied = useRef(searchParams.toString());

  // Follow URL changes made elsewhere, such as a "Clear filters" link.
  useEffect(() => {
    const current = searchParams.toString();
    if (current === lastApplied.current) return;
    lastApplied.current = current;
    clearTimeout(timer.current);
    setFilters(fromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply(next: Filters) {
    clearTimeout(timer.current);
    const query = toQueryString(next);
    if (query === lastApplied.current) return;
    lastApplied.current = query;
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function update(change: Partial<Filters>, delay = 0) {
    const next = { ...filters, ...change };
    setFilters(next);
    clearTimeout(timer.current);
    if (delay) timer.current = setTimeout(() => apply(next), delay);
    else apply(next);
  }

  const filtered = Boolean(filters.q.trim() || filters.programmeId || filters.status);

  return (
    <form
      role="search"
      aria-busy={pending}
      onSubmit={(event) => {
        event.preventDefault();
        apply(filters);
      }}
      className="mb-4 grid gap-3 rounded-lg border bg-muted/30 p-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="q">Search</Label>
        <Input
          id="q"
          name="q"
          type="search"
          placeholder="Name or Student ID"
          autoComplete="off"
          value={filters.q}
          onChange={(event) => update({ q: event.target.value }, SEARCH_DELAY_MS)}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="programmeId">Programme</Label>
        <NativeSelect
          id="programmeId"
          name="programmeId"
          value={filters.programmeId}
          onChange={(event) => update({ programmeId: event.target.value })}
          className="w-full sm:w-56"
        >
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
        <NativeSelect
          id="status"
          name="status"
          value={filters.status}
          onChange={(event) => update({ status: event.target.value })}
          className="w-full sm:w-40"
        >
          <NativeSelectOption value="">All statuses</NativeSelectOption>
          {ENROLMENT_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {filtered ? (
        <Button variant="ghost" asChild>
          <Link href={pathname}>Clear filters</Link>
        </Button>
      ) : null}
    </form>
  );
}
