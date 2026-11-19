import type { ReactNode } from 'react';
import { Aviso } from '@/components/layout/comprador/Aviso';
import { BannerCookies } from '@/components/layout/comprador/BannerCookies';
import { BarraInferior } from '@/components/layout/comprador/BarraInferior';
import { Cabecalho } from '@/components/layout/comprador/Cabecalho';
import { Hidratar } from '@/components/layout/comprador/Hidratar';
import { Rodape } from '@/components/layout/comprador/Rodape';
import { Sheets } from '@/components/layout/comprador/Sheets';
import { TenantProvider } from '@/components/providers/TenantProvider';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';

/**
 * Layout do comprador (protótipo: shopLayout). Partes estáticas renderizam no
 * servidor; CEP, sacola, sessão, cookies e modais são ilhas de cliente.
 */
export default async function CompradorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const [tenant, categorias] = await Promise.all([getTenant(slug), api.categorias.listar(slug)]);

  return (
    <TenantProvider tenant={tenant}>
      <Hidratar />
      <Cabecalho tenant={tenant} categorias={categorias} />
      <main className="pb-bottom-nav lg:pb-0">
        <div className="mx-auto w-full max-w-container px-4">{children}</div>
      </main>
      <Rodape tenant={tenant} />
      <BarraInferior />
      <BannerCookies />
      <Sheets categorias={categorias} />
      <Aviso />
    </TenantProvider>
  );
}
