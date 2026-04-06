'use client';

import styles from './session-auth-gate.module.scss';
import { getApiBaseUrl } from '@/lib/cinema-api';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const SESSIONS_PATH = '/sessions';

type GateState = 'checking' | 'ok';

// SessionAuthGate is a component that checks if the user is authenticated and redirects to the login page if not
// It is impossible to use cookies in the frontend because of the CORS policy (could be solved by using a proxy)
export function SessionAuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>('checking');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/me`, {
          credentials: 'include',
          cache: 'no-store',
        });
        if (cancelled) return;

        if (res.status === 401) {
          router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
          return;
        }

        if (!res.ok) {
          router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
          return;
        }

        setState('ok');
      } catch {
        if (!cancelled) {
          router.replace(`/login?returnUrl=${encodeURIComponent(SESSIONS_PATH)}`);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
