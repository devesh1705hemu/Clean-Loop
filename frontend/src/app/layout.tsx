import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CleanLoop • Waste Tracking & Recurrence MVP',
  description:
    'Track waste from report → cleanup → follow-up → recurrence → dashboard with deterministic verification.',
  icons: {
    icon: [
      { url: '/favicon.ico.png', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico.png',
    apple: '/favicon.ico.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 bg-white border-b border-slate-200" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1 flex flex-col">
            <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
