// astro.config.mjs
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

// https://docs.astro.build
export default defineConfig({
  output: 'server',      // usamos SSR y endpoints /api
  adapter: vercel(),     // adapter de Vercel (serverless functions)
});
