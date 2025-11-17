import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless'; // 👈 importante: /serverless

// https://docs.astro.build
export default defineConfig({
  output: 'server',          // 👈 necesario para SSR
  adapter: vercel(),         // 👈 usamos funciones serverless de Vercel

  // si tienes más cosas (integrations, etc.), déjalas aquí:
  // integrations: [],
});
