"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { errorProps, FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import { callApi } from "@/lib/api-client";

/** A module staff can choose, with how many of its results are Published now. */
export type ModuleOption = { id: string; code: string; label: string; publishedCount: number };

type ModuleGroup = { programme: string; modules: ModuleOption[] };

/** "1 published CS101 result will return to Pending.", or null when nothing would change. */
function reopenWarning(option: ModuleOption | undefined): string | null {
  if (!option || option.publishedCount === 0) return null;
  const results = option.publishedCount === 1 ? "result" : "results";
  return `${option.publishedCount} published ${option.code} ${results} will return to Pending.`;
}

type AssessmentFormProps =
  | { mode: "create"; moduleGroups: ModuleGroup[]; timeZone: string }
  | { mode: "edit"; assessmentId: string; initial: { title: string; deadline: string }; timeZone: string };

export function AssessmentForm(props: AssessmentFormProps) {
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [moduleId, setModuleId] = useState("");
  const warning =
    props.mode === "create"
      ? reopenWarning(props.moduleGroups.flatMap((group) => group.modules).find((option) => option.id === moduleId))
      : null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result =
      props.mode === "create"
        ? await callApi<{ assessment: { id: string } }>("/api/assessments", { method: "POST", json: values })
        : await callApi<{ assessment: { id: string } }>(`/api/assessments/${props.assessmentId}`, { method: "PATCH", json: values });
    if (result.ok) {
      router.push(`/staff/assessments/${result.data.assessment.id}`);
      router.refresh();
      return;
    }
    setPending(false);
    setFields(result.error.fields ?? {});
    setFormError(result.error.fields && Object.keys(result.error.fields).length > 0 ? null : result.error.message);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-xl gap-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField id="title" label="Title" error={fields.title}>
        <Input id="title" name="title" defaultValue={props.mode === "edit" ? props.initial.title : ""} autoComplete="off" {...errorProps("title", fields.title)} />
      </FormField>
      {props.mode === "create" ? (
        <FormField id="moduleId" label="Module" error={fields.moduleId}>
          <NativeSelect
            id="moduleId"
            name="moduleId"
            value={moduleId}
            onChange={(event) => setModuleId(event.target.value)}
            className="w-full"
            {...errorProps("moduleId", fields.moduleId)}
            aria-describedby={
              [fields.moduleId ? "moduleId-error" : null, warning ? "moduleId-warning" : null].filter(Boolean).join(" ") ||
              undefined
            }
          >
            <NativeSelectOption value="">Choose a module</NativeSelectOption>
            {props.moduleGroups.map((group) => (
              <NativeSelectOptGroup key={group.programme} label={group.programme}>
                {group.modules.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelectOptGroup>
            ))}
          </NativeSelect>
          {warning ? (
            <p id="moduleId-warning" className="text-xs text-tone-yellow-foreground">
              {warning} Students see &quot;Results not yet released&quot; until the new assessment is graded and published again.
            </p>
          ) : null}
        </FormField>
      ) : null}
      <FormField id="deadline" label="Submission deadline" error={fields.deadline} hint={`Date and time in ${props.timeZone}.`}>
        <Input
          id="deadline"
          name="deadline"
          type="datetime-local"
          defaultValue={props.mode === "edit" ? props.initial.deadline : ""}
          {...errorProps("deadline", fields.deadline)}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : props.mode === "create" ? "Create assessment" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
