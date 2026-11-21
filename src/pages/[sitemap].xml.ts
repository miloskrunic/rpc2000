import { indexingEnabled, homepageUrl } from '../../site.config.mjs';

// No sitemap is generated for a prototype with an unconfirmed domain.
export function getStaticPaths() {
  return indexingEnabled ? [{ params: { sitemap: 'sitemap' } }] : [];
}

export function GET() {
  // The only indexable page is the homepage. Do not include 404 or fragment URLs.
  const url = String(homepageUrl).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${url}</loc></url></urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
