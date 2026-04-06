import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './page.module.scss';

type AuthMarketingShellProps = {
  cardTitle: string;
  cardLead: string;
  children: ReactNode;
};

export function AuthMarketingShell({ cardTitle, cardLead, children }: AuthMarketingShellProps) {
  return (
    <div className={styles.page}>
      <a href="#auth-main" className={styles.skipLink}>
        Skip to form
      </a>

      <header className={styles.header}>
        <nav className={styles.nav} aria-label="Primary">
          <Link className={styles.brandLink} href="/">
            The Cinematic Pulse
          </Link>
          <ul className={styles.navLinks}>
            <li>
              <Link className={styles.navLink} href="/">
                Movies
              </Link>
            </li>
            <li>
              <Link className={styles.navLink} href="/">
                Cinemas
              </Link>
            </li>
            <li>
              <Link className={styles.navLink} href="/">
                Offers
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main id="auth-main" className={styles.main} tabIndex={-1}>
        <div className={styles.column}>
          <div className={styles.intro}>
            <p className={styles.tagline}>The Cinematic Pulse</p>
            <p className={styles.subtitle}>Your portal to extraordinary cinema.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>{cardTitle}</h1>
              <p id="auth-card-description" className={styles.cardLead}>
                {cardLead}
              </p>
            </div>

            {children}

            <div className={styles.legal}>
              <p className={styles.legalText}>
                By continuing, you agree to our{' '}
                <Link className={styles.inlineLink} href="/">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link className={styles.inlineLink} href="/">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>The Cinematic Pulse</div>
          <ul className={styles.footerLinks}>
            <li>
              <Link className={styles.footerLink} href="/">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link className={styles.footerLink} href="/">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link className={styles.footerLink} href="/">
                Contact Support
              </Link>
            </li>
            <li>
              <Link className={styles.footerLink} href="/">
                Careers
              </Link>
            </li>
          </ul>
          <p className={styles.copyright}>© {new Date().getFullYear()} The Cinematic Pulse. All rights reserved.</p>
        </div>
      </footer>

      <div className={styles.accentBar} aria-hidden="true" />
    </div>
  );
}
