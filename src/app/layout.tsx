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
  title: 'TravelPro - Travel Business Platform',
  description: 'Empower your travel business with AI-driven lead generation and seamless package management',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TravelPro',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
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
