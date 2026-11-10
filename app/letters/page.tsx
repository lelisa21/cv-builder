import type { Metadata } from 'next';
import LetterGenerator from '@/components/LetterGenerator';

export const metadata: Metadata = {
  title: 'Letters',
  description:
    'Write application and cover letters in CV Studio by BikatTech, in English, Afaan Oromo, or Amharic.',
};

export default function LettersPage() {
  return <LetterGenerator />;
}
