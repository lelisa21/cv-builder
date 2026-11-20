import { createPageMetadata } from '@/lib/site-url';
import LetterGenerator from '@/components/LetterGenerator';

export const metadata = createPageMetadata(
  'Cover Letter Generator',
  'Write application and cover letters in CV Studio by BikatTech, in English, Afaan Oromo, or Amharic.',
  '/letters',
);

export default function LettersPage() {
  return <LetterGenerator />;
}
