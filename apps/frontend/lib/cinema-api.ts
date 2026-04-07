import type {
  HallPublic,
  ReservationPublic,
  SessionPublic,
  SessionSeatWithAvailability,
  UserPublic,
} from './cinema-types';
import { useAuthStore } from './auth-store';

export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

async function parseErrorBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m) && m.every((x) => typeof x === 'string')) return m.join(', ');
  }
  return fallback;
}

function mergeAuthHeaders(headers: Headers): void {
  const token = useAuthStore.getState().accessToken;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
}

function pathWithoutQuery(path: string): string {
  const i = path.indexOf('?');
  return i === -1 ? path : path.slice(0, i);
}

const AUTH_ME_TTL_MS = 8000;
let authMeMemo: { token: string; user: UserPublic; at: number } | null = null;
const authMeInflight = new Map<string, Promise<UserPublic>>();

function invalidateAuthMeCache(): void {
  authMeMemo = null;
  authMeInflight.clear();
}

let sessionRestoreInflight: Promise<void> | null = null;

/**
 * If there is no access token, tries POST /auth/refresh (httpOnly cookie).
 * Deduplicates parallel callers (AuthBoundary + SessionAuthGate).
 */
export function ensureAccessFromRefresh(): Promise<void> {
  if (useAuthStore.getState().accessToken) {
    return Promise.resolve();
  }
  if (!sessionRestoreInflight) {
    sessionRestoreInflight = tryRefreshAccessToken()
      .then(() => undefined)
      .finally(() => {
        sessionRestoreInflight = null;
      });
  }
  return sessionRestoreInflight;
}

/** Uses cookie credentials; does not recurse through fetchJson 401 handling. */
export async function tryRefreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { accessToken: string };
    if (!data.accessToken) return false;
    useAuthStore.getState().setAccessToken(data.accessToken);
    invalidateAuthMeCache();
    return true;
  } catch {
    return false;
  }
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchJsonOnce<T>(path, init, true);
}

async function fetchJsonOnce<T>(path: string, init?: RequestInit, allowRefreshRetry = true): Promise<T> {
  const headers = new Headers(init?.headers);
  const method = (init?.method ?? 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && init?.body != null) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  mergeAuthHeaders(headers);

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const pathOnly = pathWithoutQuery(path);
    if (
      res.status === 401 &&
      allowRefreshRetry &&
      pathOnly !== '/auth/refresh' &&
      pathOnly !== '/auth/login' &&
      pathOnly !== '/auth/register'
    ) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) {
        return fetchJsonOnce<T>(path, init, false);
      }
    }
    const body = await parseErrorBody(res);
    throw new ApiError(
      res.status,
      messageFromBody(body, res.statusText),
      body,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// --- GET dedupe / short cache (avoids duplicate network from Strict Mode or parallel mounts) ---

let hallsCache: HallPublic[] | null = null;
let hallsInflight: Promise<HallPublic[]> | null = null;

const sessionsInflight = new Map<string, Promise<SessionPublic[]>>();
const seatsInflight = new Map<string, Promise<SessionSeatWithAvailability[]>>();

export function invalidateHallsCache(): void {
  hallsCache = null;
  hallsInflight = null;
}

/** Clear cached reads (call on logout). */
export function invalidateApiReadCaches(): void {
  hallsCache = null;
  hallsInflight = null;
  sessionsInflight.clear();
  seatsInflight.clear();
  invalidateAuthMeCache();
}

async function getHallsDeduped(): Promise<HallPublic[]> {
  if (hallsCache) return hallsCache;
  if (hallsInflight) return hallsInflight;
  hallsInflight = fetchJson<HallPublic[]>('/halls')
    .then((d) => {
      hallsCache = d;
      hallsInflight = null;
      return d;
    })
    .catch((e) => {
      hallsInflight = null;
      throw e;
    });
  return hallsInflight;
}

function sessionsCacheKey(params: { date: string; hallId: string }): string {
  return `${params.date}\u0000${params.hallId}`;
}

async function getSessionsDeduped(params: { date: string; hallId: string }): Promise<SessionPublic[]> {
  const key = sessionsCacheKey(params);
  const existing = sessionsInflight.get(key);
  if (existing) return existing;
  const q = new URLSearchParams({ date: params.date, hallId: params.hallId });
  const p = fetchJson<SessionPublic[]>(`/sessions?${q.toString()}`).finally(() =>
    sessionsInflight.delete(key),
  );
  sessionsInflight.set(key, p);
  return p;
}

async function getSessionSeatsDeduped(sessionId: string): Promise<SessionSeatWithAvailability[]> {
  const existing = seatsInflight.get(sessionId);
  if (existing) return existing;
  const p = fetchJson<SessionSeatWithAvailability[]>(`/sessions/${sessionId}/seats`).finally(() =>
    seatsInflight.delete(sessionId),
  );
  seatsInflight.set(sessionId, p);
  return p;
}

/** Validates JWT; dedupes parallel calls and memoizes briefly per token. */
export async function fetchAuthMe(): Promise<UserPublic> {
  const token = useAuthStore.getState().accessToken ?? '';
  if (!token) {
    throw new ApiError(401, 'Unauthorized');
  }
  const now = Date.now();
  if (authMeMemo?.token === token && now - authMeMemo.at < AUTH_ME_TTL_MS) {
    return authMeMemo.user;
  }
  const inflight = authMeInflight.get(token);
  if (inflight) return inflight;
  const p = fetchJson<UserPublic>('/auth/me', { cache: 'no-store' })
    .then((user) => {
      authMeMemo = { token, user, at: Date.now() };
      authMeInflight.delete(token);
      return user;
    })
    .catch((e) => {
      authMeInflight.delete(token);
      throw e;
    });
  authMeInflight.set(token, p);
  return p;
}

export const cinemaApi = {
  getHalls(): Promise<HallPublic[]> {
    return getHallsDeduped();
  },

  getSessions(params: { date: string; hallId: string }): Promise<SessionPublic[]> {
    return getSessionsDeduped(params);
  },

  getSessionSeats(sessionId: string): Promise<SessionSeatWithAvailability[]> {
    return getSessionSeatsDeduped(sessionId);
  },

  createReservation(body: { sessionId: string; seatId: string }): Promise<ReservationPublic> {
    return fetchJson<ReservationPublic>('/reservations', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  confirmReservation(reservationId: string): Promise<ReservationPublic> {
    return fetchJson<ReservationPublic>(`/reservations/${reservationId}/confirm`, {
      method: 'POST',
    });
  },

  createReservationsBatch(body: {
    sessionId: string;
    seatIds: string[];
  }): Promise<ReservationPublic[]> {
    return fetchJson<ReservationPublic[]>('/reservations/batch', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
};
