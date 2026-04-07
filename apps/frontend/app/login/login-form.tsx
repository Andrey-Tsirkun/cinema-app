'use client';

import { useAuthStore } from '@/lib/auth-store';
import { ApiError, fetchJson } from '@/lib/cinema-api';
import type { AuthSuccessResponse } from '@/lib/cinema-types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.scss';

const DEFAULT_RETURN = '/sessions';

/** Seeded dev users — must match `apps/backend/prisma/seed.ts` (DEV_SEED_USERS). */
const SEEDED_TEST_USERS = [
  { id: '1' as const, label: 'User 1', email: 'test@test.test', password: 'testtest12' },
  {
    id: '2' as const,
    label: 'User 2',
    email: 'new-test@new-test.test',
    password: 'newtest12',
  },
] as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const data = await fetchJson<AuthSuccessResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      const raw = searchParams.get('returnUrl');
      const next =
        raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : DEFAULT_RETURN;
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      className={styles.authForm}
      onSubmit={onSubmit}
      aria-describedby="auth-card-description"
    >
      <label className={styles.fieldLabel} htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className={styles.fieldInput}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className={styles.fieldLabel} htmlFor="login-password">
        Password
      </label>
      <input
        id="login-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className={styles.fieldInput}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className={styles.submitButton} disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>

      <div className={styles.testModeBlock} aria-label="Testing mode shortcuts">
        <p className={styles.testModeCaption}>Testing mode</p>
        <div className={styles.testUserRow}>
          {SEEDED_TEST_USERS.map((u) => (
            <button
              key={u.id}
              type="button"
              className={styles.testUserButton}
              onClick={() => {
                setEmail(u.email);
                setPassword(u.password);
                setError(null);
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.switchAuth}>
        No account?{' '}
        <Link className={styles.inlineLink} href="/register">
          Create one
        </Link>
      </p>
    </form>
  );
}
