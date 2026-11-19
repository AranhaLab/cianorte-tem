import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { RegistrarSW } from '@/components/providers/RegistrarSW';
import { getTenant, tenantCssVars } from '@/lib/tenant';
import { TENANT_SLUGS } from '@/mocks/tenants';
import '../globals.css';

/*
 * Layout raiz POR CIDADE. Fica dentro de [tenant] para que <html> já saia
 * com a marca e a cor do acento corretas no SSR (sem piscar a cor errada).
 */

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

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
      <body suppressHydrationWarning>
        {children}
        <RegistrarSW />
      </body>
    </html>
  );
}
