import type { Metadata } from 'next';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { FiltrosVitrine, lerFiltros } from '@/components/vitrine/FiltrosVitrine';
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTenant((await params).tenant);
  return { title: `Ofertas de ${t.nome}`, alternates: { canonical: '/ofertas' } };
}

/**
 * Protótipo: vOfertas. Padrão: só produtos com desconto, do maior para o menor.
 * Com ?ord=vendidos vira "Mais vendidos" de todas as lojas.
 */
export default async function Ofertas({ params, searchParams }: Props) {
  const slug = (await params).tenant;
  const sp = await searchParams;
  const { ord, f } = lerFiltros(sp, 'desconto');
  const laterais = lerLaterais(sp);
  const [t, { itens: produtos, facetas }, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.produtos.pesquisar(slug, { ord, f, soOfertas: ord !== 'vendidos', laterais }),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  const itens = montarItens(produtos, lojas, categorias);

  return (
    <>
      <CabecalhoPagina
        kicker="Todas as lojas"
        titulo={ord === 'vendidos' ? 'Mais vendidos' : `Ofertas de ${t.nome}`}
      />
      <div className="my-[26px] flex flex-col gap-3">
        <FiltrosVitrine base="/ofertas" ord={ord} f={f} laterais={laterais}>
          <PainelFiltros base="/ofertas" facetas={facetas} atuais={laterais} manter={{ ord, f }} />
        </FiltrosVitrine>
        <FiltrosAtivos base="/ofertas" atuais={laterais} facetas={facetas} manter={{ ord, f }} />
        {itens.length ? (
          <GradeProdutos>
            {itens.map((it) => (
              <CartaoProduto key={it.produto.id} item={it} />
            ))}
          </GradeProdutos>
        ) : (
          <CaixaVazia
            icone="tag"
            titulo="Nenhuma oferta agora"
            texto="Volte mais tarde ou tire algum filtro."
          />
        )}
      </div>
    </>
  );
}
