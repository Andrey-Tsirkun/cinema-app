import { AuthBoundary } from '@/components/AuthBoundary';
import '@/styles/globals.scss';
import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-app-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-app-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'The Cinematic Pulse',
  description: 'Book cinema seats and immersive screenings',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      <body>
        <AuthBoundary>{children}</AuthBoundary>
      </body>
    </html>
  );
}
