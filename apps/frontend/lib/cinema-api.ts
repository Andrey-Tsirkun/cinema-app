import type {
  HallPublic,
  ReservationPublic,
  SessionPublic,
  SessionSeatWithAvailability,
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

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
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
  });

  if (!res.ok) {
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

export const cinemaApi = {
  getHalls(): Promise<HallPublic[]> {
    return fetchJson<HallPublic[]>('/halls');
  },

  getSessions(params: { date: string; hallId: string }): Promise<SessionPublic[]> {
    const q = new URLSearchParams({ date: params.date, hallId: params.hallId });
    return fetchJson<SessionPublic[]>(`/sessions?${q.toString()}`);
  },

  getSessionSeats(sessionId: string): Promise<SessionSeatWithAvailability[]> {
    return fetchJson<SessionSeatWithAvailability[]>(`/sessions/${sessionId}/seats`);
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
};
