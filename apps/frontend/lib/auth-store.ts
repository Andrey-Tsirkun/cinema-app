import { create } from 'zustand';

/** Legacy zustand `persist` key — must never hold tokens again; clear on client load. */
const LEGACY_AUTH_STORAGE_KEY = 'cinema-auth';

if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
  } catch {
    // ignore quota / private mode
  }
}

type AuthState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
};

/** Access token lives in memory only (not localStorage) — survives until tab close or refresh via httpOnly cookie. */
export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  setAccessToken: (accessToken) => set({ accessToken }),
  clearAuth: () => set({ accessToken: null }),
}));
