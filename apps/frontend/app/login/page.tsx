import Link from 'next/link';
import styles from './page.module.scss';

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
}

const googleAuthPath = '/auth/google';

export default function LoginPage() {
  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  const googleAuthHref = `${apiBase}${googleAuthPath}`;

  return (
    <div className={styles.page}>
      <a href="#login-main" className={styles.skipLink}>
        Skip to sign in form
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

      <main id="login-main" className={styles.main} tabIndex={-1}>
        <div className={styles.column}>
          <div className={styles.intro}>
            <p className={styles.tagline}>The Cinematic Pulse</p>
            <p className={styles.subtitle}>Your portal to extraordinary cinema.</p>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h1 className={styles.title}>Welcome back</h1>
              <p id="login-card-description" className={styles.cardLead}>
                Sign in to manage your bookings and rewards
              </p>
            </div>

            <div>
              <a
                className={styles.googleLink}
                href={googleAuthHref}
                aria-describedby="login-card-description"
              >
                <svg
                  className={styles.googleIcon}
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </a>
            </div>

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
