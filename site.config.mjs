// GitHub Pages sets SITE_URL and BASE_PATH in its build workflow.
// The preview remains noindex until final company content is approved.
export const launch = Object.freeze({
  siteUrl: process.env.SITE_URL || '',
  allowIndexing: false,
});

const configuredBase = process.env.BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9_-]+\/?)?$/.test(configuredBase)) {
  throw new Error('BASE_PATH must be / or a single repository path such as /rpc2000/.');
}
export const basePath = configuredBase === '/' ? '/' : `${configuredBase.replace(/\/$/, '')}/`;

function validateSiteUrl(value) {
  if (!value) return undefined;
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.pathname !== '/' || hostname === 'localhost' || hostname.endsWith('.localhost') ||
      !hostname.includes('.') || /\.(example|test|invalid|local|internal)$/.test(hostname) ||
      /(^|\.)example\.(com|org|net)$/.test(hostname) ||
      /^\d+(\.\d+){3}$/.test(hostname) || hostname.includes(':')) {
    throw new Error('site.config.mjs: use the approved public HTTPS origin, without a path, query or placeholder hostname.');
  }
  return url.origin;
}

export const siteUrl = validateSiteUrl(launch.siteUrl);
if (launch.allowIndexing && !siteUrl) {
  throw new Error('site.config.mjs: a real siteUrl is required before allowIndexing can be enabled.');
}
export const indexingEnabled = launch.allowIndexing && Boolean(siteUrl);
export const homepageUrl = siteUrl ? new URL(basePath, siteUrl).href : undefined;
