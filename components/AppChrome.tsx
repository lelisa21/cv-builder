'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * The studio is a focused, full-viewport workspace. Every other route keeps
 * the marketing chrome so the rest of the product stays familiar.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const focused = pathname === '/builder' || pathname.startsWith('/builder/');

  if (focused) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
