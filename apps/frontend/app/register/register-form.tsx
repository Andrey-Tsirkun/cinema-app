'use client';

import { useAuthStore } from '@/lib/auth-store';
import { ApiError, fetchJson } from '@/lib/cinema-api';
import type { AuthSuccessResponse } from '@/lib/cinema-types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from '../login/page.module.scss';

const DEFAULT_RETURN = '/sessions';

export function RegisterForm() {
  const router = useRouter();
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
      const data = await fetchJson<AuthSuccessResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAccessToken(data.accessToken);
      router.replace(DEFAULT_RETURN);
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
      <label className={styles.fieldLabel} htmlFor="register-email">
        Email
      </label>
      <input
        id="register-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        className={styles.fieldInput}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <label className={styles.fieldLabel} htmlFor="register-password">
        Password
      </label>
      <input
        id="register-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        className={styles.fieldInput}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <span className={styles.fieldHint}>At least 8 characters.</span>

      {error ? (
        <p className={styles.fieldError} role="alert">
          {error}
        </p>
      ) : null}

      <button type="submit" className={styles.submitButton} disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>

      <p className={styles.switchAuth}>
        Already have an account?{' '}
        <Link className={styles.inlineLink} href="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
