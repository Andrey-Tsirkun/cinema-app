'use client';

import styles from './home.module.scss';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import Link from 'next/link';

export function HomePage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <p className={styles.tagline}>The Cinematic Pulse</p>
        <p className={styles.lead}>
          Book immersive screenings, pick your seat, and hold your spot in seconds.
        </p>
        <Link className={styles.cta} href="/sessions">
          Book seats
        </Link>
      </main>
      <SiteFooter />
      <div className={styles.accentBar} aria-hidden="true" />
    </div>
  );
}
