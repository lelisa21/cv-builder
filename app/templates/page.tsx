import { createPageMetadata } from '@/lib/site-url';
import TemplateAnalyzer from '@/components/cv/TemplateAnalyzer';

export const metadata = createPageMetadata(
  'CV Templates',
  'Browse professional CV templates in CV Studio by BikatTech, or analyze a template and fill it in.',
  '/templates',
);

export default function TemplatesPage() {
  return <TemplateAnalyzer />;
}
