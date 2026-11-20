import { createPageMetadata } from '@/lib/site-url';
import HomePage from '@/components/home/HomePage';

const description =
  'Build a professional CV or resume with an intuitive editor, polished templates, job matching, cover letters, and print-ready exports.';

export const metadata = createPageMetadata(
  'CV Studio | CV & Resume Builder',
  description,
  '/',
);

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'CV Studio',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description,
  publisher: {
    '@type': 'Organization',
    name: 'BikatTech',
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <HomePage />
    </>
  );
}
