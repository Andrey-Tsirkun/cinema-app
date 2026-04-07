import { useAuthStore } from './auth-store';
import { getApiBaseUrl } from './cinema-api';

/** Clears local auth; best-effort server logout (stateless API). */
export async function performLogout(): Promise<void> {
  try {
    await fetch(`${getApiBaseUrl()}/auth/logout`, { method: 'POST' });
  } catch {
    // ignore network errors
  }
  useAuthStore.getState().clearAuth();
}
