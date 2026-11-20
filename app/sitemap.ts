import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];

  return ['/', '/templates', '/jobs', '/letters'].map((pathname) => ({
    url: new URL(pathname, siteUrl).toString(),
  }));
}
