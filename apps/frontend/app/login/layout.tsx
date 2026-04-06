import { Manrope, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from './login-font-root.module.scss';

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
  title: 'Sign in',
  description: 'Sign in with Google to manage bookings and rewards',
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${manrope.variable} ${spaceGrotesk.variable} ${styles.fontRoot}`}>
      {children}
    </div>
  );
}
