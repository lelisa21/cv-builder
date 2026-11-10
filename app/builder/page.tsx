import type { Metadata } from 'next';
import Studio from '@/components/studio/Studio';

export const metadata: Metadata = {
  title: 'Editor',
  description:
    'Compose, design and export a considered CV in CV Studio by BikatTech. Deep typography, flexible sections and live pagination.',
};

export default function BuilderPage() {
  return <Studio />;
}
