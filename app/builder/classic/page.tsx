import { createPageMetadata } from '@/lib/site-url';
import Link from 'next/link';
import CVBuilder from '@/components/forms/CVBuilder';

export const metadata = createPageMetadata(
  'Classic CV Builder',
  'The original CV builder in CV Studio by BikatTech, preserved for existing documents and workflows.',
  '/builder/classic',
  { index: false, follow: false },
);

export default function ClassicBuilderPage() {
  return (
    <div className="classic-builder">
      <div className="classic-builder-banner">
        <span>
          You are in the classic builder. The new <strong>CV Studio</strong> editor has deeper design
          controls, live pagination and richer exports.
        </span>
        <Link href="/builder">Open the studio →</Link>
      </div>
      <CVBuilder />
    </div>
  );
}
