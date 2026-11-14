import { Label } from "@/components/ui/label";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

/** A labelled form control with its hint and error message underneath. */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Props that link a control to its error message for screen readers. */
export function errorProps(id: string, error?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": `${id}-error` } : {};
}
