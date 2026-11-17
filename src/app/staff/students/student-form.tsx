"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { errorProps, FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ENROLMENT_STATUSES, STATUS_LABELS } from "@/domain/schemas/student";
import { callApi } from "@/lib/api-client";

type Programme = { id: string; name: string };

export type StudentFormValues = {
  fullName: string;
  email: string;
  dateOfBirth: string;
  programmeId: string;
  academicYear: string;
  status: string;
};

type StudentFormProps =
  | { mode: "create"; programmes: Programme[]; initial: StudentFormValues }
  | { mode: "edit"; programmes: Programme[]; initial: StudentFormValues; studentId: string; billingLocked: boolean };

export function StudentForm(props: StudentFormProps) {
  const { mode, programmes, initial } = props;
  const router = useRouter();
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const billingLocked = props.mode === "edit" && props.billingLocked;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

    const result =
      props.mode === "create"
        ? await callApi<{ student: { studentNumber: string } }>("/api/students", { method: "POST", json: values })
        : await callApi<{ student: { studentNumber: string } }>(`/api/students/${props.studentId}`, { method: "PATCH", json: values });

    if (result.ok) {
      router.push(`/staff/students/${result.data.student.studentNumber}`);
      router.refresh();
      return;
    }
    setPending(false);
    setFields(result.error.fields ?? {});
    setFormError(result.error.fields && Object.keys(result.error.fields).length > 0 ? null : result.error.message);
  }

  const field = (name: keyof StudentFormValues | "initialPassword") => ({ id: name, error: fields[name] });

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-2xl gap-5">
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField {...field("fullName")} label="Full name">
          <Input id="fullName" name="fullName" defaultValue={initial.fullName} autoComplete="off" {...errorProps("fullName", fields.fullName)} />
        </FormField>
        <FormField {...field("email")} label="Email">
          <Input id="email" name="email" type="email" defaultValue={initial.email} autoComplete="off" {...errorProps("email", fields.email)} />
        </FormField>
        <FormField {...field("dateOfBirth")} label="Date of birth">
          <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={initial.dateOfBirth} {...errorProps("dateOfBirth", fields.dateOfBirth)} />
        </FormField>
        <FormField {...field("status")} label="Enrolment status">
          <NativeSelect id="status" name="status" defaultValue={initial.status} className="w-full" {...errorProps("status", fields.status)}>
            {ENROLMENT_STATUSES.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {STATUS_LABELS[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          {...field("programmeId")}
          label="Programme"
          hint={billingLocked ? "Locked because a payment has been recorded." : undefined}
        >
          <NativeSelect
            id="programmeId"
            name="programmeId"
            defaultValue={initial.programmeId}
            className="w-full"
            disabled={billingLocked}
            {...errorProps("programmeId", fields.programmeId)}
          >
            <NativeSelectOption value="">Choose a programme</NativeSelectOption>
            {programmes.map((programme) => (
              <NativeSelectOption key={programme.id} value={programme.id}>
                {programme.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <FormField
          {...field("academicYear")}
          label="Academic year"
          hint={billingLocked ? "Locked because a payment has been recorded." : "For example 2025/26"}
        >
          <Input
            id="academicYear"
            name="academicYear"
            defaultValue={initial.academicYear}
            placeholder="2025/26"
            disabled={billingLocked}
            {...errorProps("academicYear", fields.academicYear)}
          />
        </FormField>
        {mode === "create" ? (
          <FormField {...field("initialPassword")} label="Initial password" hint="At least 8 characters. Share it with the student.">
            <Input
              id="initialPassword"
              name="initialPassword"
              type="password"
              autoComplete="new-password"
              {...errorProps("initialPassword", fields.initialPassword)}
            />
          </FormField>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Create student" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
