import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminProvider } from '@/components/admin/Comum';
import { MenuAdmin } from '@/components/admin/MenuAdmin';
import { Aviso } from '@/components/layout/comprador/Aviso';
import { TenantProvider } from '@/components/providers/TenantProvider';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';

/**
 * Administração da plataforma (CLAUDE.md §4 e §16). Área restrita: nunca indexar nem
 * guardar em cache. Na versão real, o middleware exige sessão com papel admin e cada
 * rota /v1/admin/* confere o papel e o tenant no servidor.
 */
export const metadata: Metadata = {
  title: { default: 'Administração', template: '%s · Administração' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const [tenant, lojas, categorias, produtos] = await Promise.all([
    getTenant(slug),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
    api.produtos.buscar(slug),
  ]);
  return (
    <TenantProvider tenant={tenant}>
      <div className="min-h-screen bg-neutro-150">
        <AdminProvider dados={{ lojas, categorias, produtos }}>
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-5 p-4">
            <MenuAdmin />
            <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">{children}</main>
          </div>
        </AdminProvider>
      </div>
      <Aviso />
    </TenantProvider>
  );
}
