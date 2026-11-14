/** Builds requests for calling Route Handler functions in-process. */
export function jsonRequest(method: string, url: string, body?: unknown): Request {
  return new Request(new URL(url, "http://localhost"), {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function withParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}

export type ErrorJson = { error: { code: string; message: string; fields?: Record<string, string> } };
