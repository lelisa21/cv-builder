import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './studio.css';
import { AppProvider } from '@/lib/AppContext';
import { AuthProvider } from '@/lib/AuthContext';
import AppChrome from '@/components/AppChrome';
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Lelisa Studio — A calmer way to build a CV',
  description:
    'An editorial CV studio with deep typographic control, live pagination, ATS intelligence and beautiful, print-ready documents.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700;800&family=Merriweather:wght@300;400;700;900&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;900&family=Roboto:wght@400;500;700;900&family=Sora:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Puter.js Multi-AI Provider Bridge */}
        <Script src="https://js.puter.com/v2/" strategy="afterInteractive" />
        <AuthProvider>
          <AppProvider>
            <AppChrome>{children}</AppChrome>
          </AppProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
