import type { Metadata } from 'next';
import Link from 'next/link';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { FiltrosAtivos } from '@/components/vitrine/FiltrosAtivos';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { PainelFiltros } from '@/components/vitrine/PainelFiltros';
import { lerLaterais } from '@/lib/filtros';
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
  const sp = await searchParams;
  const bruto = sp.q;
  const laterais = lerLaterais(sp);
  const termo = (typeof bruto === 'string' ? bruto : '').trim().slice(0, 100);
  const [t, { itens: produtos, facetas }, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.produtos.pesquisar(slug, { q: termo, laterais }),
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
      <div className="my-[26px] flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PainelFiltros base="/busca" facetas={facetas} atuais={laterais} manter={{ q: termo }} />
        </div>
        <FiltrosAtivos base="/busca" atuais={laterais} facetas={facetas} manter={{ q: termo }} />
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
