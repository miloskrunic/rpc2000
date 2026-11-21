import { defineConfig } from 'astro/config';
import { siteUrl, basePath } from './site.config.mjs';

export default defineConfig({
  output: 'static',
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
