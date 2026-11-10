import type { Metadata } from 'next';
import Studio from '@/components/studio/Studio';

export const metadata: Metadata = {
  title: 'Lelisa Studio — The CV atelier',
  description:
    'Compose, design and export a considered CV in one calm workspace. Deep typography, flexible sections and live pagination.',
};

export default function BuilderPage() {
  return <Studio />;
}
