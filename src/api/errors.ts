export interface ApiErrorBody {
  error?: {
    type?: string;
    message?: string;
    payload?: Record<string, string[]>;
  };
}

export class ApiError extends Error {
  readonly status: number;
  readonly type: string | undefined;
  readonly payload: Record<string, string[]> | undefined;

  constructor(status: number, body: ApiErrorBody | null) {
    super(body?.error?.message ?? `Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.type = body?.error?.type;
    this.payload = body?.error?.payload;
  }
}

export const isApiError = (error: unknown): error is ApiError =>
  error instanceof ApiError;
