import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseAuthProvider } from '@/context/SupabaseAuthContext';
import { Toaster } from 'sonner';
import { AuthErrorHandler } from '@/components/shared/AuthErrorHandler';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export const metadata: Metadata = {
  title: 'TravelSelBuy - AI-Powered Travel Booking Platform',
  description: 'AI-Powered Travel Booking Platform for Small Travel Agents. Generate leads, manage customers, and book packages—all in one intelligent platform.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TravelSelBuy',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FF6B35',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className} suppressHydrationWarning={true}>
        <SupabaseAuthProvider>
          {children}
          <AuthErrorHandler />
          <Toaster position="top-right" />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
