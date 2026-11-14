"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { errorProps, FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/api-client";

type PaymentFormProps = { studentId: string; today: string; outstanding: string; disabled: boolean };

export function PaymentForm({ studentId, today, outstanding, disabled }: PaymentFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFormError(null);
    setSaved(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const result = await callApi<{ payment: { reference: string } }>(`/api/students/${studentId}/payments`, {
      method: "POST",
      json: values,
    });
    setPending(false);
    if (result.ok) {
      setFields({});
      setSaved(`Payment ${result.data.payment.reference} recorded.`);
      formRef.current?.reset();
      router.refresh();
      return;
    }
    setFields(result.error.fields ?? {});
    setFormError(result.error.fields && Object.keys(result.error.fields).length > 0 ? null : result.error.message);
  }

  if (disabled) {
    return <p className="text-sm text-muted-foreground">This student has paid in full. There is nothing left to record.</p>;
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4">
      {formError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}
      {saved ? (
        <Alert>
          <CheckCircle2 />
          <AlertDescription>{saved}</AlertDescription>
        </Alert>
      ) : null}
      <FormField id="amount" label="Amount" error={fields.amount} hint={`Outstanding: ${outstanding}`}>
        <Input id="amount" name="amount" inputMode="decimal" placeholder="250.00" autoComplete="off" {...errorProps("amount", fields.amount)} />
      </FormField>
      <FormField id="paidOn" label="Payment date" error={fields.paidOn}>
        <Input id="paidOn" name="paidOn" type="date" max={today} defaultValue={today} {...errorProps("paidOn", fields.paidOn)} />
      </FormField>
      <FormField id="reference" label="Reference number" error={fields.reference} hint="Bank or receipt reference; each one can be used once.">
        <Input id="reference" name="reference" autoComplete="off" {...errorProps("reference", fields.reference)} />
      </FormField>
      <Button type="submit" disabled={pending} className="justify-self-start">
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
