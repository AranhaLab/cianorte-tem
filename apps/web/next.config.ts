import path from 'node:path';
import type { NextConfig } from 'next';

const dev = process.env.NODE_ENV !== 'production';
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Content Security Policy estática (compatível com ISR).
 * Uma CSP com nonce por requisição exigiria renderização dinâmica em todas as
 * páginas e perderia o cache por cidade; por isso script-src mantém 'unsafe-inline'
 * (scripts inline do próprio Next). Revisar ao definir o provedor de pagamento:
 * o domínio do SDK de tokenização entra em script-src/frame-src/connect-src.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}${dev ? ' ws:' : ''}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(dev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** Cabeçalhos de segurança aplicados a todas as rotas. */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  // Imagem Docker enxuta: copia só o servidor standalone (ver apps/web/Dockerfile).
  output: 'standalone',
  // Pasta do build configurável: permite gerar/testar o build sem disputar o .next de um `next dev` aberto.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // O app é apps/web, não a raiz do monorepo (lá só há os comandos de atalho).
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  reactStrictMode: true,
  // O navegador sempre pede /favicon.ico: entrega o ícone da cidade (antes dava 404 no console).
  async rewrites() {
    return [{ source: '/favicon.ico', destination: '/icons/192.png' }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // O service worker não pode ficar em cache longo, senão o PWA não atualiza.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
    ];
  },
};

export default nextConfig;
