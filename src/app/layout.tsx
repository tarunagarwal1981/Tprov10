import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SupabaseAuthProvider } from '@/context/SupabaseAuthContext';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TravelPro - Travel Business Platform',
  description: 'Empower your travel business with AI-driven lead generation and seamless package management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <SupabaseAuthProvider>
          {children}
          <Toaster position="top-right" />
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
