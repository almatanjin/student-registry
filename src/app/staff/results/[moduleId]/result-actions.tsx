"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ResultState } from "@/domain/results";
import { callApi } from "@/lib/api-client";

type RowActionsProps = { studentId: string; moduleId: string; studentName: string; state: ResultState; complete: boolean };

/** Publish, withhold, or return to Pending one student's module results. */
export function RowActions({ studentId, moduleId, studentName, state, complete }: RowActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: ResultState) {
    setPending(true);
    setError(null);
    const result = await callApi(`/api/students/${studentId}/modules/${moduleId}/result`, { method: "PUT", json: { state: next } });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  const actions: { next: ResultState; label: string }[] = [];
  if (state !== "PUBLISHED") actions.push({ next: "PUBLISHED", label: "Publish" });
  if (state !== "WITHHELD") actions.push({ next: "WITHHELD", label: "Withhold" });
  if (state !== "PENDING") actions.push({ next: "PENDING", label: "Return to pending" });

  return (
    <div className="grid justify-items-start gap-1">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Result actions for ${studentName}`}>
        {actions.map((action) => (
          <Button
            key={action.next}
            size="sm"
            variant={action.next === "PUBLISHED" ? "default" : "outline"}
            disabled={pending || (action.next === "PUBLISHED" && !complete)}
            title={action.next === "PUBLISHED" && !complete ? "Every assessment needs a grade first" : undefined}
            onClick={() => void change(action.next)}
          >
            {action.label}
          </Button>
        ))}
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/** Publishes every complete, Pending result on the module and reports the outcome. */
export function PublishAllButton({ moduleId }: { moduleId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function publishAll() {
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await callApi<{ message: string }>(`/api/modules/${moduleId}/publish`, { method: "POST" });
    setPending(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setMessage(result.data.message);
    router.refresh();
  }

  return (
    <div className="grid justify-items-end gap-2">
      <Button onClick={() => void publishAll()} disabled={pending}>
        <Send />
        {pending ? "Publishing…" : "Publish all complete results"}
      </Button>
      {message ? (
        <Alert role="status" className="w-auto">
          <CheckCircle2 />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
