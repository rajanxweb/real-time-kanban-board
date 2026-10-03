const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const TOKEN_KEY = 'kanban_access_token';

export type User = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
};

type ApiErrorEnvelope = {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readAuthToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function writeAuthToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = authenticated ? readAuthToken() : null;
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const errorPayload = isRecord(payload) ? (payload as ApiErrorEnvelope) : undefined;
    const apiError = errorPayload?.error;

    if (response.status === 401 && authenticated) {
      clearAuthToken();
      window.dispatchEvent(new Event('kanban:unauthorized'));
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    throw new ApiError(
      apiError?.message ?? 'The request could not be completed.',
      response.status,
      apiError?.code,
    );
  }

  if (
    !isRecord(payload) ||
    payload.success !== true ||
    !isRecord(payload.data)
  ) {
    throw new Error('The server returned an invalid response.');
  }

  return payload.data as T;
}
