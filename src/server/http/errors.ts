import { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export type ErrorBody = {
  error: { code: string; message: string; fields?: FieldErrors };
};

/** An error with a known HTTP status and a message that is safe to show to the user. */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(fields: FieldErrors, message = "Check the highlighted fields.") {
    super(400, "validation_failed", message, fields);
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super(401, "unauthorized", "Sign in to continue.");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super(403, "forbidden", "You do not have access to this.");
  }
}

/** Used for missing records and for records that belong to someone else. */
export class NotFoundError extends AppError {
  constructor() {
    super(404, "not_found", "Not found.");
  }
}

export class ConflictError extends AppError {
  /** `field` attaches the message to one form field as well. */
  constructor(code: string, message: string, field?: string) {
    super(409, code, message, field ? { [field]: message } : undefined);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string, field?: string) {
    super(413, "payload_too_large", message, field ? { [field]: message } : undefined);
  }
}

/** First message for each field path, keyed by the dotted path (for example `email`). */
export function fieldErrorsFromZod(error: ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ??= issue.message;
  }
  return fields;
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return toErrorResponse(new ValidationError(fieldErrorsFromZod(error)));
  }
  if (error instanceof AppError) {
    const body: ErrorBody = { error: { code: error.code, message: error.message } };
    if (error.fields) body.error.fields = error.fields;
    return Response.json(body, { status: error.status });
  }
  console.error(error);
  const body: ErrorBody = {
    error: { code: "internal_error", message: "Something went wrong. Please try again." },
  };
  return Response.json(body, { status: 500 });
}
