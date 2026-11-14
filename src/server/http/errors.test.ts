import { afterEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  UnauthorizedError,
  ValidationError,
  toErrorResponse,
} from "./errors";

async function bodyOf(response: Response) {
  return (await response.json()) as { error: { code: string; message: string; fields?: Record<string, string> } };
}

afterEach(() => vi.restoreAllMocks());

describe("toErrorResponse", () => {
  test("a validation error answers 400 with a message for each field", async () => {
    const response = toErrorResponse(
      new ValidationError({ email: "Enter a valid email address", fullName: "Enter the full name" }),
    );

    expect(response.status).toBe(400);
    expect(await bodyOf(response)).toEqual({
      error: {
        code: "validation_failed",
        message: "Check the highlighted fields.",
        fields: { email: "Enter a valid email address", fullName: "Enter the full name" },
      },
    });
  });

  test("a failed schema check answers 400 with the first message for each field", async () => {
    const schema = z.object({ email: z.email("Enter a valid email address"), age: z.number("Enter a number") });
    const result = schema.safeParse({ email: "nope", age: "x" });

    const response = toErrorResponse(result.error);

    expect(response.status).toBe(400);
    expect((await bodyOf(response)).error.fields).toEqual({
      email: "Enter a valid email address",
      age: "Enter a number",
    });
  });

  test("not found answers 404 and says nothing about the record", async () => {
    const response = toErrorResponse(new NotFoundError());

    expect(response.status).toBe(404);
    expect(await bodyOf(response)).toEqual({ error: { code: "not_found", message: "Not found." } });
  });

  test("a conflict answers 409 with its code and message", async () => {
    const response = toErrorResponse(new ConflictError("duplicate_email", "This email is already in use", "email"));

    expect(response.status).toBe(409);
    expect(await bodyOf(response)).toEqual({
      error: {
        code: "duplicate_email",
        message: "This email is already in use",
        fields: { email: "This email is already in use" },
      },
    });
  });

  test("signed-out, wrong-role, and oversized-file errors answer 401, 403, and 413", () => {
    expect(toErrorResponse(new UnauthorizedError()).status).toBe(401);
    expect(toErrorResponse(new ForbiddenError()).status).toBe(403);
    expect(toErrorResponse(new PayloadTooLargeError("The file is larger than 10 MB")).status).toBe(413);
  });

  test("an unexpected error answers 500 with a generic message and is logged", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = toErrorResponse(new Error("connection refused at 10.0.0.5"));

    expect(response.status).toBe(500);
    expect(await bodyOf(response)).toEqual({
      error: { code: "internal_error", message: "Something went wrong. Please try again." },
    });
    expect(log).toHaveBeenCalledOnce();
  });
});
