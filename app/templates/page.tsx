import type { Metadata } from 'next';
import TemplateAnalyzer from '@/components/cv/TemplateAnalyzer';

export const metadata: Metadata = {
  title: 'Templates',
  description:
    'Browse CV layouts in CV Studio by BikatTech, or analyze a template and fill it in.',
};

export default function TemplatesPage() {
  return <TemplateAnalyzer />;
}
