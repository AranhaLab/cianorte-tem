import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Aviso } from '@/components/layout/comprador/Aviso';
import { MenuPainel } from '@/components/painel/MenuPainel';
import { PainelProvider } from '@/components/painel/PainelContexto';
import { TenantProvider } from '@/components/providers/TenantProvider';
import { CaixaVazia } from '@/components/ui/Basicos';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';

/**
 * Layout próprio do painel do lojista (protótipo: panelLayout).
 * Área autenticada: nunca indexar. Na versão real, o middleware exige sessão de
 * lojista e a API confere a permissão de cada ação (CLAUDE.md §4).
 */
export const metadata: Metadata = {
  title: { default: 'Painel do lojista', template: '%s · Painel do lojista' },
  robots: { index: false, follow: false },
};

export default async function PainelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const [tenant, resumo, categorias] = await Promise.all([
    getTenant(slug),
    api.painel.resumo(slug),
    api.categorias.listar(slug),
  ]);
  const dados = await api.lojas.obter(slug, resumo.lojaId);

  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen bg-neutro-150">
        {dados ? (
          <PainelProvider dados={{ loja: dados.loja, produtos: dados.produtos, categorias }}>
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-5 p-4">
              <MenuPainel />
              <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">{children}</main>
            </div>
          </PainelProvider>
        ) : (
          <CaixaVazia
            icone="store"
            titulo="Nenhuma loja vinculada"
            texto={`Ainda não há loja de demonstração em ${tenant.nome}.`}
            acao={
              <Link href="/vender" className="btn btn-primary">
                Cadastrar minha loja
              </Link>
            }
          />
        )}
      </div>
      <Aviso />
    </TenantProvider>
  );
}
