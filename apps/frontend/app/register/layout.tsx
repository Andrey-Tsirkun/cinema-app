import { Manrope, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from '../login/login-font-root.module.scss';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-login-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-login-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create an account to book cinema seats and manage reservations',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${manrope.variable} ${spaceGrotesk.variable} ${styles.fontRoot}`}>
      {children}
    </div>
  );
}
