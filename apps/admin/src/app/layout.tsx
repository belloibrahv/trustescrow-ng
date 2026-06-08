import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { LayoutContent } from '@/components/LayoutContent';

export const metadata: Metadata = {
  title: {
    default: 'TrustEscrow NG - Admin Portal',
    template: '%s | TrustEscrow NG Admin'
  },
  description: 'Secure escrow transaction management and administration platform for TrustEscrow NG',
  keywords: [
    'escrow',
    'secure transactions', 
    'payment protection',
    'admin dashboard',
    'fintech',
    'Nigeria'
  ],
  authors: [{ name: 'TrustEscrow NG' }],
  creator: 'TrustEscrow NG',
  publisher: 'TrustEscrow NG',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://trustescrow-ng-admin.vercel.app'
  ),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TrustEscrow NG - Admin Portal',
    description: 'Secure escrow transaction management platform',
    siteName: 'TrustEscrow NG Admin',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrustEscrow NG - Admin Portal',
    description: 'Secure escrow transaction management platform',
  },
  robots: {
    index: false, // Admin portals should not be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' }
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#1e40af" />
        <meta name="msapplication-TileColor" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
      </head>
      <body className="h-full font-sans antialiased bg-slate-50">
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
