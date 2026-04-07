'use client';

import styles from './auth-checking.module.scss';
import { useAuthStore } from '@/lib/auth-store';
import { ensureAccessFromRefresh } from '@/lib/cinema-api';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type ReactNode } from 'react';

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === '/') return true;
  if (pathname.startsWith('/sessions')) return true;
  return false;
}

function isPublicAuthPath(pathname: string | null): boolean {
  return pathname === '/login' || pathname === '/register';
}

function AuthChecking() {
  return (
    <div className={styles.wrap}>
      <p className={styles.message} role="status" aria-live="polite">
        Checking sign-in…
      </p>
    </div>
  );
}

function AuthBoundaryInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureAccessFromRefresh();
      if (!cancelled) setSessionReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionReady) return;

    if (isPublicAuthPath(pathname) && accessToken) {
      const raw = searchParams.get('returnUrl');
      const next =
        raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/sessions';
      router.replace(next);
      return;
    }

    if (isProtectedPath(pathname) && !accessToken) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname || '/')}`);
    }
  }, [sessionReady, pathname, accessToken, router, searchParams]);

  if (!sessionReady) {
    if (isPublicAuthPath(pathname)) {
      return <>{children}</>;
    }
    if (isProtectedPath(pathname)) {
      return <AuthChecking />;
    }
    return <>{children}</>;
  }

  if (isPublicAuthPath(pathname) && accessToken) {
    return <AuthChecking />;
  }

  if (isProtectedPath(pathname) && !accessToken) {
    return <AuthChecking />;
  }

  return <>{children}</>;
}

export function AuthBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<AuthChecking />}>
      <AuthBoundaryInner>{children}</AuthBoundaryInner>
    </Suspense>
  );
}
