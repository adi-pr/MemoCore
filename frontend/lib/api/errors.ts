export class ApiError extends Error {
  /** HTTP status, or null when the backend could not be reached. */
  readonly status: number | null

  constructor(status: number | null, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "ApiError"
    this.status = status
  }
}

type ApiResult<T> = {
  data?: T
  error?: unknown
  response: Response
}

/**
 * Resolves an openapi-fetch request to its data, or throws an ApiError
 * carrying the backend's error message.
 */
export async function unwrap<T>(request: Promise<ApiResult<T>>): Promise<T> {
  let result: ApiResult<T>

  try {
    result = await request
  } catch (cause) {
    throw new ApiError(null, "Could not reach the backend", { cause })
  }

  const { data, error, response } = result

  if (error !== undefined || !response.ok) {
    throw new ApiError(response.status, errorMessage(error, response))
  }

  return data as T
}

function errorMessage(error: unknown, response: Response): string {
  // FastAPI sends { detail: string } for HTTPException and
  // { detail: [{ msg, ... }] } for validation errors.
  if (error && typeof error === "object" && "detail" in error) {
    const { detail } = error

    if (typeof detail === "string") {
      return detail
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (item && typeof item === "object" ? item.msg : null))
        .filter((message): message is string => typeof message === "string")

      if (messages.length > 0) {
        return messages.join("; ")
      }
    }
  }

  return `Backend request failed with status ${response.status}`
}
