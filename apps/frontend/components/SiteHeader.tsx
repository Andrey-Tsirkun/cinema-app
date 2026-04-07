'use client';

import styles from './SiteHeader.module.scss';
import { NAV_PLACEHOLDER } from '@/lib/nav-placeholders';
import { performLogout } from '@/lib/logout-client';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export type SiteHeaderActiveNav = 'movies' | 'cinemas' | 'offers' | null;

type SiteHeaderProps = {
  activeNav?: SiteHeaderActiveNav;
};

export function SiteHeader({ activeNav = null }: SiteHeaderProps) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  const onLogout = useCallback(async () => {
    await performLogout();
    router.replace('/login');
  }, [router]);

  return (
    <header className={styles.nav}>
      <div className={styles.navInner}>
        <Link className={styles.brand} href="/">
          The Cinematic Pulse
        </Link>
        <ul className={styles.navLinks}>
          <li>
            <Link
              className={`${styles.navLink} ${activeNav === 'movies' ? styles.navLinkActive : ''}`}
              href={NAV_PLACEHOLDER.movies}
            >
              Movies
            </Link>
          </li>
          <li>
            <Link
              className={`${styles.navLink} ${activeNav === 'cinemas' ? styles.navLinkActive : ''}`}
              href={activeNav === 'cinemas' ? '/sessions' : NAV_PLACEHOLDER.cinemas}
              {...(activeNav === 'cinemas' ? { 'aria-current': 'page' as const } : {})}
            >
              Cinemas
            </Link>
          </li>
          <li>
            <Link
              className={`${styles.navLink} ${activeNav === 'offers' ? styles.navLinkActive : ''}`}
              href={NAV_PLACEHOLDER.offers}
            >
              Offers
            </Link>
          </li>
        </ul>
        <div className={styles.navActions}>
          {accessToken ? (
            <button type="button" className={styles.logoutBtn} onClick={onLogout}>
              Log out
            </button>
          ) : (
            <Link className={styles.loginBtn} href="/login">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
