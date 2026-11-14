export type ApiError = { code: string; message: string; fields?: Record<string, string> };

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** Sends a request to one of the app's API routes and returns either the JSON body or its error. */
export async function callApi<T>(url: string, init: { method: string; json?: unknown; body?: BodyInit }): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: init.method,
      headers: init.json === undefined ? undefined : { "content-type": "application/json" },
      body: init.json === undefined ? init.body : JSON.stringify(init.json),
    });
  } catch {
    return { ok: false, error: { code: "network_error", message: "Could not reach the server. Check your connection and try again." } };
  }
  const payload = (await response.json().catch(() => null)) as { error?: ApiError } | null;
  if (response.ok) return { ok: true, data: payload as T };
  return {
    ok: false,
    error: payload?.error ?? { code: "http_error", message: "Something went wrong. Please try again." },
  };
}
