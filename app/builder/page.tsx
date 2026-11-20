import { createPageMetadata } from '@/lib/site-url';
import Studio from '@/components/studio/Studio';

export const metadata = createPageMetadata(
  'CV Editor',
  'Compose, design and export a considered CV in CV Studio by BikatTech, with flexible sections and live pagination.',
  '/builder',
);

export default function BuilderPage() {
  return <Studio />;
}
