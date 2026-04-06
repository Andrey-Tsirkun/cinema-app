import { Manrope, Space_Grotesk } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import styles from './sessions-font-root.module.scss';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sessions-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-sessions-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Book seats',
  description: 'Choose a session and pick your seats',
};

export default function SessionsLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${manrope.variable} ${spaceGrotesk.variable} ${styles.fontRoot}`}>
      {children}
    </div>
  );
}
