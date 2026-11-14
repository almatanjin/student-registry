import { toErrorResponse } from "./errors";

/**
 * Wraps a Route Handler so that any thrown error becomes the shared JSON error response.
 */
export function route<Context = unknown>(
  handler: (request: Request, context: Context) => Promise<Response>,
): (request: Request, context: Context) => Promise<Response> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
