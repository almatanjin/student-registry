"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { errorProps, FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/api-client";

/** Lets staff give a student who cannot sign in a temporary password, which the student must change. */
export function ResetPasswordForm({ studentId }: { studentId: string }) {
  const [open, setOpen] = useState(false);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await callApi(`/api/students/${studentId}/password`, { method: "PUT", json: values });
    setPending(false);
    if (result.ok) {
      setFieldError(undefined);
      setOpen(false);
      setDone(true);
      return;
    }
    setFieldError(result.error.fields?.temporaryPassword);
    setFormError(result.error.fields?.temporaryPassword ? null : result.error.message);
  }

  if (!open) {
    return (
      <div className="grid gap-3">
        {done ? (
          <Alert>
            <CheckCircle2 />
            <AlertDescription>
              Password reset. The student must choose a new password when they next sign in.
            </AlertDescription>
          </Alert>
        ) : null}
        <div>
          <Button
            variant="outline"
            onClick={() => {
              setDone(false);
              setOpen(true);
            }}
          >
            <KeyRound />
            Reset password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid max-w-sm gap-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      <FormField
        id="temporaryPassword"
        label="Temporary password"
        hint="At least 8 characters. Give it to the student; they must change it when they sign in."
        error={fieldError}
      >
        <Input
          id="temporaryPassword"
          name="temporaryPassword"
          type="password"
          autoComplete="new-password"
          autoFocus
          {...errorProps("temporaryPassword", fieldError)}
        />
      </FormField>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Set temporary password"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
