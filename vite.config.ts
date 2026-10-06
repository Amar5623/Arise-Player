import { fileURLToPath, URL } from 'node:url';
import type { IncomingMessage } from 'node:http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const SERVER_ENV = [
  'ANTHROPIC_API_KEY',
  'AI_MODEL',
  'AI_PROVIDER',
  'APP_PASSCODE',
  'OPENAI_API_KEY',
  'GEMINI_API_KEY',
];

const readBody = (req: IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let data = '';
    req.on('data', (c: Buffer) => (data += c.toString()));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });

/** `npm run dev` serves api/system.ts the way Vercel does, so AI works locally with a .env.local. */
function localApi(): Plugin {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/system', async (req, res) => {
        const mod = (await server.ssrLoadModule('/api/system.ts')) as {
          POST: (r: Request) => Promise<Response>;
        };
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers))
          if (typeof v === 'string') headers.set(k, v);
        const response = await mod.POST(
          new Request('http://localhost/api/system', {
            method: req.method,
            headers,
            body: req.method === 'POST' ? await readBody(req) : undefined,
          }),
        );
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await response.text());
      });
    },
  };
}

/** Preloads the three Latin faces the first screen paints with, so text never waits on CSS discovery. */
function preloadFonts(): Plugin {
  const wanted = [
    /geist-latin-wght-normal/,
    /geist-mono-latin-wght-normal/,
    /saira-semi-condensed-latin-600-normal/,
  ];
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter(
          (f) => f.endsWith('.woff2') && wanted.some((w) => w.test(f)),
        );
        return files.map((f) => ({
          tag: 'link',
          attrs: { rel: 'preload', href: `/${f}`, as: 'font', type: 'font/woff2', crossorigin: '' },
          injectTo: 'head' as const,
        }));
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const k of SERVER_ENV) if (env[k] && !process.env[k]) process.env[k] = env[k];

  return {
    plugins: [
      react(),
      tailwindcss(),
      localApi(),
      preloadFonts(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['mark.svg', 'apple-touch-icon.png', 'favicon-32.png'],
        manifest: {
          name: 'Player System',
          short_name: 'Player',
          description: 'Daily quests, training Gates and progression for one player.',
          start_url: '/today',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#05070c',
          theme_color: '#05070c',
          categories: ['health', 'fitness', 'productivity'],
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // Latin and Latin-ext (₹) woff2 only; other subsets and .woff fallbacks never load here.
          globPatterns: [
            '**/*.{js,css,html,svg,png}',
            '**/*-latin-*.woff2',
            '**/*-latin-ext-*.woff2',
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
        },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
    test: {
      include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'api/**/*.test.ts'],
      environment: 'node',
    },
  };
});
