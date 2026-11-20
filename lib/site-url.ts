import type { Metadata } from 'next';

const configuredUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

export const siteUrl = (() => {
  if (!configuredUrl) return undefined;
  const url = new URL(configuredUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('NEXT_PUBLIC_SITE_URL must use HTTP or HTTPS.');
  }
  return url.origin;
})();

export function createPageMetadata(
  title: string,
  description: string,
  pathname: string,
  robots?: Metadata['robots'],
): Metadata {
  return {
    title,
    description,
    alternates: siteUrl ? { canonical: pathname } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'CV Studio',
      ...(siteUrl ? { url: pathname } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    ...(robots ? { robots } : {}),
  };
}
