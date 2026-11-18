import fs from 'node:fs'
import tailwindcss from '@tailwindcss/vite'

// Базовый путь для GitHub Pages: /<имя-репозитория>/ (задаётся в CI через NUXT_APP_BASE_URL)
const baseURL = process.env.NUXT_APP_BASE_URL || '/'
const siteUrl = (process.env.NUXT_PUBLIC_SITE_URL || 'https://example.github.io').replace(/\/$/, '')

// Все маршруты уроков — для гарантированного пререндера
function contentRoutes(): string[] {
  try {
    const manifest = JSON.parse(fs.readFileSync('./app/generated/manifest.json', 'utf8'))
    const routes = ['/', '/modules', '/progress']
    for (const m of manifest.modules) {
      routes.push(`/modules/${m.slug}`)
      for (const l of m.lessons) routes.push(`/modules/${m.slug}/${l.slug}`)
    }
    return routes
  } catch {
    return ['/']
  }
}

const themeScript = `(function(){try{var s=localStorage.getItem('vueuse-color-scheme');var d=s==='dark'||((!s||s==='auto')&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: true,

  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@formkit/auto-animate/nuxt',
    '@nuxt/fonts',
    '@nuxtjs/seo',
    '@vite-pwa/nuxt',
  ],

  css: ['~/assets/css/main.css'],

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'ru' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#F7F4EE', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#12141B', media: '(prefers-color-scheme: dark)' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', href: `${baseURL}favicon.ico`, sizes: '48x48' },
        { rel: 'icon', href: `${baseURL}logo.svg`, type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: `${baseURL}apple-touch-icon-180x180.png` },
      ],
      script: [{ innerHTML: themeScript, tagPosition: 'head' }],
    },
  },

  experimental: {
    viewTransition: true,
  },

  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['canvas-confetti', 'fuse.js', 'lucide-vue-next', 'mermaid'],
    },
  },

  fonts: {
    defaults: {
      weights: [400, 500, 600, 700, 800],
      subsets: ['cyrillic', 'cyrillic-ext', 'latin'],
    },
  },

  // ---------- Nuxt SEO: только то, что работает на статическом хостинге ----------
  site: {
    url: siteUrl,
    name: 'ЧПУ · Академия',
    description: 'Интерактивный курс для подготовки к собеседованию на оператора станков с ЧПУ: устройство станков, чертежи, измерения, G-код, режущий инструмент, охрана труда.',
    defaultLocale: 'ru',
    indexable: true,
  },
  sitemap: { zeroRuntime: true },
  robots: { groups: [{ userAgent: '*', allow: '/' }] },
  schemaOrg: {
    identity: { type: 'Organization', name: 'ЧПУ · Академия' },
  },
  ogImage: { enabled: false },
  linkChecker: { enabled: false },
  skewProtection: { enabled: false },
  aiReady: { enabled: false },

  // ---------- PWA ----------
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ЧПУ · Академия',
      short_name: 'ЧПУ Академия',
      description: 'Курс подготовки оператора станков с ЧПУ — учитесь офлайн и отмечайте прогресс',
      lang: 'ru',
      theme_color: '#F7F4EE',
      background_color: '#F7F4EE',
      display: 'standalone',
      orientation: 'portrait',
      start_url: baseURL,
      scope: baseURL,
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Заранее кэшируем приложение, шрифты и схемы; уроки живут в JS-чанках — курс работает офлайн.
      globPatterns: ['_nuxt/**/*.{js,css}', '**/*.{woff,woff2,svg,png,ico,webmanifest}', 'index.html', '200.html'],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      runtimeCaching: [
        {
          // Страницы: сначала сеть, без сети — кэш, а для непосещённых — SPA-оболочка
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 4,
            expiration: { maxEntries: 200 },
            precacheFallback: { fallbackURL: `${baseURL}200.html` },
          },
        },
        {
          urlPattern: ({ url }) => url.pathname.endsWith('_payload.json'),
          handler: 'StaleWhileRevalidate',
          options: { cacheName: 'payloads', expiration: { maxEntries: 200 } },
        },
      ],
    },
    client: { installPrompt: true, periodicSyncForUpdates: 3600 },
    devOptions: { enabled: false },
  },

  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: contentRoutes(),
      failOnError: false,
    },
  },

  typescript: { strict: true },
})
