import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  pages: true,
  devServer: {
    host: process.env.NUXT_HOST || '0.0.0.0',
    port: Number(process.env.NUXT_PORT || 3000),
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'
    }
  },
  experimental: {
    appManifest: false,
  },
  devtools: { enabled: false },
  css: ['./app/assets/css/tailwind.css'],
  vite: {
    server: {
      hmr: {
        protocol: process.env.NUXT_HMR_PROTOCOL || 'ws',
        port: Number(process.env.NUXT_HMR_PORT || 24679),
        clientPort: Number(process.env.NUXT_HMR_PORT || 24679),
      },
    },
    plugins: [
      tailwindcss(),
    ],
  },
});
