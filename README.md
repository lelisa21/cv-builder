# CV Studio

CV Studio is a multilingual CV and resume builder by BikatTech. It includes a
live document editor, classic builder, template analyzer, job matching, cover
letter tools, and PDF, Word, and image exports.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Run the production checks and build:

```bash
npm run lint
npm run build
```

## Deployment and SEO

Set `NEXT_PUBLIC_SITE_URL` to the canonical production origin (for example,
`https://cv.example.com`) in the deployment environment. Vercel deployments can
also use `VERCEL_PROJECT_PRODUCTION_URL` when the explicit variable is absent.
The configured origin is used for canonical links, social metadata, and the
generated `sitemap.xml` and `robots.txt`; without it, absolute SEO URLs are
intentionally omitted rather than pointing crawlers at a preview or localhost.

AI integrations and optional Supabase cloud features are configured through the
environment variables used by the corresponding services; never commit secrets.
