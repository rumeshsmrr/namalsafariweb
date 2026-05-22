export type ApiErrorBody = {
  /** Exact exception message from the server. */
  error: string;
  /** Error constructor name, e.g. SqliteError, TypeError. */
  name?: string;
  /** Stack trace or cause — helps debug production admin issues. */
  detail?: string;
};

/** Build JSON body with the real error message (no generic replacements). */
export function apiErrorFromUnknown(err: unknown): ApiErrorBody {
  if (err instanceof Error) {
    const body: ApiErrorBody = {
      error: err.message,
      name: err.name,
    };
    if (err.stack) {
      body.detail = err.stack;
    } else if (err.cause !== undefined) {
      body.detail = String(err.cause);
    }
    return body;
  }

  return { error: String(err) };
}
