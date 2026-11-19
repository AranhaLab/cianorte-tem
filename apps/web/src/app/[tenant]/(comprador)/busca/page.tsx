import type { Metadata } from 'next';
import Link from 'next/link';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';
import { montarItens } from '@/lib/vitrine';

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Resultados de busca não devem ser indexados (conteúdo duplicado/infinito). */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = (await searchParams).q;
  return {
    title: typeof q === 'string' && q ? `Busca: ${q}` : 'Busca',
    robots: { index: false, follow: true },
  };
}

/** Protótipo: vBusca. */
export default async function Busca({ params, searchParams }: Props) {
  const slug = (await params).tenant;
  const bruto = (await searchParams).q;
  const termo = (typeof bruto === 'string' ? bruto : '').trim().slice(0, 100);
  const [t, produtos, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.produtos.buscar(slug, { q: termo }),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  const itens = montarItens(produtos, lojas, categorias);

  return (
    <>
      <CabecalhoPagina
        titulo={termo ? `Resultados para “${termo}”` : 'Todos os produtos'}
        acao={<span className="text-[13px] text-grafite-2">{itens.length} produtos</span>}
      />
      <div className="my-[26px]">
        {itens.length ? (
          <GradeProdutos>
            {itens.map((it) => (
              <CartaoProduto key={it.produto.id} item={it} />
            ))}
          </GradeProdutos>
        ) : (
          <CaixaVazia
            icone="search"
            titulo={`Nada encontrado em ${t.nome}`}
            texto="Confira a ortografia ou navegue pelas categorias."
            acao={
              <Link href="/categorias" className="btn btn-primary">
                Ver categorias
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
