import {
  getSessionGeneration,
  notifySessionExpired,
  recoverSession,
} from './authRecovery';
import { getCsrfToken } from './csrf';
import { ApiError, type ApiErrorBody } from './errors';
import { getFingerprint } from '../shared/lib/fingerprint';

interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  authRecovery?: boolean;
}

interface InternalRequestOptions extends ApiRequestOptions {
  authRetryAttempted?: boolean;
  csrfRetryAttempted?: boolean;
}

const parseBody = async <T>(response: Response): Promise<T> => {
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

const executeRequest = async <T>(
  path: string,
  options: InternalRequestOptions,
): Promise<T> => {
  const method = options.method?.toUpperCase() ?? 'GET';
  const csrfToken = await getCsrfToken();
  const headers = new Headers(options.headers);
  headers.set('X-Requested-With', 'XMLHttpRequest');

  if (method === 'POST' || method === 'PUT') {
    headers.set('X-CSRF-TOKEN', csrfToken);
  }
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');

  const observedGeneration = getSessionGeneration();
  const {
    body,
    authRecovery: _authRecovery,
    authRetryAttempted: _authRetryAttempted,
    csrfRetryAttempted: _csrfRetryAttempted,
    ...requestOptions
  } = options;
  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };
  const response = await fetch(path, requestInit);

  if (response.status === 419 && !options.csrfRetryAttempted) {
    await getCsrfToken(true);
    return executeRequest<T>(path, { ...options, csrfRetryAttempted: true });
  }

  const shouldRecover = options.authRecovery !== false;
  if (
    response.status === 401 &&
    shouldRecover &&
    !options.authRetryAttempted
  ) {
    try {
      await recoverSession(observedGeneration, () =>
        executeRequest<void>('/auth/token/rotate', {
          method: 'POST',
          body: { fingerprint: getFingerprint() },
          authRecovery: false,
        }),
      );
      return await executeRequest<T>(path, {
        ...options,
        authRetryAttempted: true,
      });
    } catch (error) {
      await notifySessionExpired();
      throw error;
    }
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    const error = new ApiError(response.status, body);
    if (response.status === 401 && shouldRecover) {
      await notifySessionExpired();
    }
    throw error;
  }

  return parseBody<T>(response);
};

export const apiRequest = <T>(
  path: string,
  options: ApiRequestOptions = {},
) => executeRequest<T>(path, options);
