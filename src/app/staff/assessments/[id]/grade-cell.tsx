"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/api-client";

type GradeCellProps = {
  assessmentId: string;
  studentId: string;
  studentName: string;
  initial: number | null;
  /** The student's results for this module are already visible to them. */
  published: boolean;
};

/** Inline grade entry for one student, with a confirmation before changing an already released result. */
export function GradeCell({ assessmentId, studentId, studentName, initial, published }: GradeCellProps) {
  const router = useRouter();
  const [value, setValue] = useState(initial === null ? "" : String(initial));
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const inputId = `grade-${studentId}`;
  const changed = value.trim() !== (initial === null ? "" : String(initial));

  async function save(confirmed: boolean) {
    if (published && !confirmed) {
      setConfirming(true);
      return;
    }
    setPending(true);
    setError(null);
    const trimmed = value.trim();
    const result = await callApi(`/api/assessments/${assessmentId}/grades/${studentId}`, {
      method: "PUT",
      json: { grade: trimmed === "" ? null : trimmed },
    });
    setPending(false);
    setConfirming(false);
    if (!result.ok) {
      setError(result.error.fields?.grade ?? result.error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form
      className="grid gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        void save(false);
      }}
    >
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          Grade for {studentName}
        </label>
        <Input
          id={inputId}
          inputMode="numeric"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setConfirming(false);
          }}
          placeholder="0-100"
          className="w-20 tabular-nums"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
        />
        <Button type="submit" size="sm" variant="outline" disabled={pending || !changed}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {confirming ? (
        <div role="alert" className="grid gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <p className="flex items-start gap-1.5">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            This result is already released. {studentName} will see the new grade straight away.
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => void save(true)} disabled={pending}>
              Save anyway
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
