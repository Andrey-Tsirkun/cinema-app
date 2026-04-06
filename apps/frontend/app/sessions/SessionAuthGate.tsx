'use client';

import styles from './session-auth-gate.module.scss';
import { useAuthStore } from '@/lib/auth-store';
import { ApiError, fetchJson } from '@/lib/cinema-api';
import type { UserPublic } from '@/lib/cinema-types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SESSIONS_PATH = '/sessions';

type GateState = 'checking' | 'ok';

export function SessionAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [state, setState] = useState<GateState>('checking');
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const p = useAuthStore.persist;
    if (!p) {
      setStorageReady(true);
      return;
    }
    if (p.hasHydrated()) {
      setStorageReady(true);
      return;
    }
    return p.onFinishHydration(() => {
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    let cancelled = false;

    (async () => {
      if (!accessToken) {
        if (!cancelled) {
          router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
        }
        return;
      }

      try {
        await fetchJson<UserPublic>('/auth/me', { cache: 'no-store' });
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
  }, [router, accessToken, clearAuth, storageReady]);

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
