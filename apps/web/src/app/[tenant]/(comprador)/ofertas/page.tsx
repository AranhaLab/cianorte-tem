import type { Metadata } from 'next';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { FiltrosVitrine, lerFiltros } from '@/components/vitrine/FiltrosVitrine';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
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
  const { ord, f } = lerFiltros(await searchParams, 'desconto');
  const [t, produtos, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.produtos.buscar(slug, { ord, f, soOfertas: ord !== 'vendidos' }),
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
        <FiltrosVitrine base="/ofertas" ord={ord} f={f} />
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
