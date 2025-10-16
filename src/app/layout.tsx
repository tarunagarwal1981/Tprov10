import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { SupabaseAuthProvider } from '@/context/SupabaseAuthContext';
import { Toaster } from 'sonner';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://travelselbuy.com'),
  title: 'TravelSelBuy - AI-Powered Travel Booking Platform',
  description: 'AI-Powered Travel Booking Platform for Small Travel Agents. Generate leads, manage customers, and book packages—all in one intelligent platform.',
  icons: {
    icon: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TravelSelBuy',
  },
  openGraph: {
    title: 'TravelSelBuy - AI-Powered Travel Booking Platform',
    description: 'AI-Powered Travel Booking Platform for Small Travel Agents',
    images: ['/logo-full.svg'],
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${inter.className}`} suppressHydrationWarning={true}>
        <SupabaseAuthProvider>
          {children}
          <Toaster position="top-right" />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
