import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Aviso } from '@/components/layout/comprador/Aviso';
import { BannerCookies } from '@/components/layout/comprador/BannerCookies';
import { Hidratar } from '@/components/layout/comprador/Hidratar';
import { TenantProvider } from '@/components/providers/TenantProvider';
import { getTenant } from '@/lib/tenant';

/**
 * Páginas de acesso (entrar, criar conta e entrada do lojista): fora do layout do
 * comprador, sem cabeçalho, categorias, rodapé nem barra inferior. Nunca indexadas.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AcessoLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const tenant = await getTenant((await params).tenant);
  return (
    <TenantProvider tenant={tenant}>
      <Hidratar />
      {children}
      <BannerCookies />
      <Aviso />
    </TenantProvider>
  );
}
