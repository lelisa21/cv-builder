import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/site-url';

export const metadata = createPageMetadata(
  'Profile',
  'Manage your CV Studio profile and saved documents.',
  '/profile',
  { index: false, follow: false },
);

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
