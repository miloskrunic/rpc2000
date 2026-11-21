import { indexingEnabled, homepageUrl } from '../../site.config.mjs';

export function GET() {
  const body = indexingEnabled && homepageUrl
    ? `User-agent: *\nAllow: /\n\nSitemap: ${homepageUrl}sitemap.xml\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
