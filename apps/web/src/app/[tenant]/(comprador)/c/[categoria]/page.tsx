import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { PaginaCategoriaCliente } from '@/components/vitrine/PaginaCategoria';
import { lerFiltros } from '@/components/vitrine/FiltrosVitrine';
import { lerLaterais } from '@/lib/filtros';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';

type Props = {
  params: Promise<{ tenant: string; categoria: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, categoria } = await params;
  const [t, v] = await Promise.all([getTenant(tenant), api.vitrine.categoria(tenant, categoria)]);
  if (!v) return {};
  return {
    title: v.categoria.nome,
    description: `${v.categoria.destaque}. ${v.total} produtos de lojas de ${t.nome} no ${t.marca}.`,
    alternates: { canonical: `/c/${v.categoria.id}` },
  };
}

export default async function PaginaCategoria({ params, searchParams }: Props) {
  const { tenant: slug, categoria: id } = await params;
  const sp = await searchParams;
  const { ord, f } = lerFiltros(sp);
  const laterais = lerLaterais(sp);
  const [t, inicial, lojas, categorias, produtosBase] = await Promise.all([
    getTenant(slug),
    api.vitrine.categoria(slug, id, { ord, f, laterais }),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
    api.produtos.buscar(slug),
  ]);
  if (!inicial && !(await cookies()).has('ct-categorias-personalizadas')) notFound();
  return (
    <PaginaCategoriaCliente
      id={id}
      inicial={inicial}
      t={t}
      lojas={lojas}
      categorias={categorias}
      produtosBase={produtosBase}
      ord={ord}
      f={f}
      laterais={laterais}
    />
  );
}
