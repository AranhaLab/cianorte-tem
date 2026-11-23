import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import type { CSSProperties, ReactNode } from 'react';
import { RegistrarSW } from '@/components/providers/RegistrarSW';
import { TenantProvider } from '@/components/providers/TenantProvider';
import { getTenant, tenantCssVars } from '@/lib/tenant';
import { TENANT_SLUGS } from '@/mocks/tenants';
import '../globals.css';

/*
 * Layout raiz POR CIDADE. Fica dentro de [tenant] para que <html> já saia
 * com a marca e a cor do acento corretas no SSR (sem piscar a cor errada).
 */

const outfit = localFont({
  src: '../../fonts/Outfit-Variable.ttf',
  weight: '100 900',
  variable: '--font-outfit',
  display: 'swap',
});
const inter = localFont({
  src: '../../fonts/Inter-Variable.ttf',
  weight: '100 900',
  variable: '--font-inter',
  display: 'swap',
});

// No desenvolvimento, um service worker de uma versão anterior pode servir arquivos
// antigos antes de o React montar. A limpeza precisa rodar mesmo se a hidratação falhar.
const limparWorkerNoDev = `
  (function () {
    if (!('serviceWorker' in navigator)) return;
    var chave = 'ct-dev-worker-removido';
    var controlador = navigator.serviceWorker.controller;
    var controlado = !!controlador && new URL(controlador.scriptURL).pathname === '/sw.js';
    navigator.serviceWorker.getRegistrations().then(async function (registros) {
      var proprios = registros.filter(function (r) {
        var worker = r.active || r.waiting || r.installing;
        return worker && new URL(worker.scriptURL).pathname === '/sw.js';
      });
      await Promise.all(proprios.map(function (r) { return r.unregister(); }));
      if ('caches' in window) {
        var nomes = await caches.keys();
        await Promise.all(nomes.filter(function (n) { return /^ct-v\\d+-/.test(n); }).map(function (n) { return caches.delete(n); }));
      }
      if (controlado && !sessionStorage.getItem(chave)) {
        sessionStorage.setItem(chave, '1');
        window.location.reload();
      } else if (!controlado) sessionStorage.removeItem(chave);
    }).catch(function () {});
  })();
`;

type Params = { params: Promise<{ tenant: string }> };

export const dynamicParams = false; // só cidades cadastradas
export const generateStaticParams = () => TENANT_SLUGS.map((tenant) => ({ tenant }));

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const t = await getTenant((await params).tenant);
  return {
    title: { default: t.marca, template: `%s · ${t.marca}` },
    description: `${t.marca} — o marketplace das lojas de ${t.nome}. ${t.slogan}`,
    applicationName: t.marca,
    manifest: '/manifest.webmanifest',
    icons: { icon: '/icons/icon.svg', apple: '/icons/apple-180.png' },
    appleWebApp: { capable: true, title: t.marca, statusBarStyle: 'default' },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#14213D', // eslint-disable-line no-restricted-syntax -- meta exige hex; = token marinho
};

export default async function TenantRootLayout({ children, params }: Params & { children: ReactNode }) {
  const t = await getTenant((await params).tenant);
  // suppressHydrationWarning: extensões do navegador (ex.: LanguageTool, Testim) põem atributos
  // em <html> e <body> antes do React carregar. Vale só para atributos destas duas tags,
  // não para o conteúdo da página.
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${inter.variable}`}
      style={tenantCssVars(t) as CSSProperties}
      suppressHydrationWarning
    >
      {process.env.NODE_ENV === 'development' && (
        <head>
          <script dangerouslySetInnerHTML={{ __html: limparWorkerNoDev }} />
        </head>
      )}
      <body suppressHydrationWarning>
        <TenantProvider tenant={t}>{children}</TenantProvider>
        <RegistrarSW />
      </body>
    </html>
  );
}
