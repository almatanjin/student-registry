"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Upload } from "lucide-react";
import { errorProps, FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/api-client";

type UploadFormProps = { assessmentId: string; replacing: boolean };

export function UploadForm({ assessmentId, replacing }: UploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldError(undefined);
    const result = await callApi<{ submission: { originalName: string } }>(
      `/api/assessments/${assessmentId}/submission`,
      { method: "POST", body: new FormData(event.currentTarget) },
    );
    setPending(false);
    if (result.ok) {
      formRef.current?.reset();
      // The page shows the confirmation, so it stays even when this form is no longer offered.
      router.replace(`?submitted=${encodeURIComponent(result.data.submission.originalName)}`, { scroll: false });
      router.refresh();
      return;
    }
    if (result.error.fields?.file) setFieldError(result.error.fields.file);
    else setError(result.error.message);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="grid gap-4">
      {error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <FormField id="file" label={replacing ? "Replace your file" : "Your file"} error={fieldError} hint="PDF or DOCX, up to 10 MB.">
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          {...errorProps("file", fieldError)}
        />
      </FormField>
      <Button type="submit" disabled={pending} className="justify-self-start">
        <Upload />
        {pending ? "Uploading…" : replacing ? "Replace submission" : "Submit"}
      </Button>
    </form>
  );
}
