import type { ApiErrorBody } from '@/types/api';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code?: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** User-facing copy when the API returns HTTP 429 (rate limit). */
export function userFacingApiMessage(err: ApiRequestError): string {
  if (err.status === 429) {
    return 'Muitas tentativas. Aguarde um minuto e tente de novo.';
  }
  return err.message;
}

export async function parseErrorResponse(res: Response): Promise<ApiRequestError> {
  let message = res.statusText || 'Request failed';
  let code: string | undefined;
  let details: Record<string, unknown> | undefined;

  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body?.error?.message) {
      message = body.error.message;
      code = body.error.code;
      details = body.error.details;
    }
  } catch {
    /* non-JSON */
  }

  return new ApiRequestError(message, res.status, code, details);
}
