import styles from './SiteFooter.module.scss';
import { NAV_PLACEHOLDER } from '@/lib/nav-placeholders';
import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>The Cinematic Pulse</div>
        <ul className={styles.footerLinks}>
          <li>
            <Link className={styles.footerLink} href={NAV_PLACEHOLDER.terms}>
              Terms of Service
            </Link>
          </li>
          <li>
            <Link className={styles.footerLink} href={NAV_PLACEHOLDER.privacy}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link className={styles.footerLink} href={NAV_PLACEHOLDER.support}>
              Contact Support
            </Link>
          </li>
          <li>
            <Link className={styles.footerLink} href={NAV_PLACEHOLDER.careers}>
              Careers
            </Link>
          </li>
        </ul>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} The Cinematic Pulse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
