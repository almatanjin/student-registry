import { ValidationError } from "./errors";

/** The request body as JSON; a missing or malformed body is a 400. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError({}, "The request body must be valid JSON.");
  }
}

/** Query string parameters as a plain object (the last value wins for repeated keys). */
export function searchParamsOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}
