'use client';

import styles from './session-auth-gate.module.scss';
import { useAuthStore } from '@/lib/auth-store';
import { ApiError, ensureAccessFromRefresh, fetchAuthMe } from '@/lib/cinema-api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SESSIONS_PATH = '/sessions';

type GateState = 'checking' | 'ok';

export function SessionAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await ensureAccessFromRefresh();
      if (cancelled) return;

      const token = useAuthStore.getState().accessToken;
      if (!token) {
        if (!cancelled) {
          router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
        }
        return;
      }

      try {
        await fetchAuthMe();
        if (!cancelled) {
          setState('ok');
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearAuth();
        }
        router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, clearAuth]);

  if (state !== 'ok') {
    return (
      <div className={styles.wrap}>
        <p className={styles.message} role="status" aria-live="polite">
          Checking sign-in…
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
