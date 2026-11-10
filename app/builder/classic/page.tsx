import type { Metadata } from 'next';
import Link from 'next/link';
import CVBuilder from '@/components/forms/CVBuilder';

export const metadata: Metadata = {
  title: 'Classic builder — Lelisa',
  description: 'The original CV builder, preserved for existing documents and workflows.',
};

export default function ClassicBuilderPage() {
  return (
    <div className="classic-builder">
      <div className="classic-builder-banner">
        <span>
          You are in the classic builder. The new <strong>Lelisa Studio</strong> has deeper design
          controls, live pagination and richer exports.
        </span>
        <Link href="/builder">Open the studio →</Link>
      </div>
      <CVBuilder />
    </div>
  );
}
