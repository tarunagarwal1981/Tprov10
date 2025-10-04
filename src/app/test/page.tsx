'use client';

import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Header />
      <main className="pt-20">
        <Hero />
      </main>
    </div>
  );
}