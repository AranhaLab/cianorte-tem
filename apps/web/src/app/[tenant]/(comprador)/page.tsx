import { JsonLd } from '@/components/ui/JsonLd';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DuplaAnuncios } from '@/components/anuncios/DuplaAnuncios';
import { FaixaAnuncio } from '@/components/anuncios/FaixaAnuncio';
import { HeroAnuncios } from '@/components/anuncios/HeroAnuncios';
import { AtalhosCategorias } from '@/components/vitrine/AtalhosCategorias';
import { CabecalhoSecao } from '@/components/vitrine/CabecalhoSecao';
import { Carrossel } from '@/components/vitrine/Carrossel';
import { CartaoLoja, GradeLojas } from '@/components/vitrine/CartaoLoja';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { FaixaConfianca } from '@/components/vitrine/FaixaConfianca';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { SecaoCarrossel } from '@/components/vitrine/SecaoCarrossel';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';
import { montarItens } from '@/lib/vitrine';

/** ISR: a vitrine de cada cidade é regenerada a cada 5 minutos. */
export const revalidate = 300;

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTenant((await params).tenant);
  return {
    title: { absolute: `${t.marca} — o comércio de ${t.nome} num lugar só` },
    description: `Compre das lojas de ${t.nome} com entrega no mesmo dia ou retirada na loja. Moda, construção, mercado, móveis e muito mais.`,
    openGraph: { title: t.marca, description: t.slogan, type: 'website', locale: 'pt_BR', siteName: t.marca },
  };
}

/** Home (protótipo: vHome). Ordem das seções: CLAUDE.md §5.1. */
export default async function Home({ params }: Props) {
  const { tenant: slug } = await params;
  const [t, v, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.vitrine.home(slug),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  const itens = (ps: typeof v.maisVendidos) => montarItens(ps, lojas, categorias);
  const anuncios = (vaga: string) => v.anuncios.filter((a) => a.vaga === vaga);
  const catPorId = new Map(categorias.map((c) => [c.id, c]));

  // Dados estruturados: busca interna do site (sitelinks search box).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: t.marca,
    potentialAction: {
      '@type': 'SearchAction',
      target: '/busca?q={termo}',
      'query-input': 'required name=termo',
    },
  };

  return (
    <>
      <JsonLd dados={jsonLd} />

      <HeroAnuncios anuncios={anuncios('H1')} />
      <AtalhosCategorias categorias={categorias} />
      <FaixaConfianca
        itens={[
          { icone: 'pin', titulo: `Só lojas de ${t.nome}`, texto: 'Quem vende é vizinho seu.' },
          { icone: 'truck', titulo: 'Entrega no mesmo dia', texto: 'Ou retire na loja sem frete.' },
          { icone: 'lock', titulo: 'Pagamento protegido', texto: 'Pix ou cartão, com dados criptografados.' },
          { icone: 'refresh', titulo: '7 dias para desistir', texto: 'Direito de arrependimento garantido.' },
        ]}
      />

      <SecaoCarrossel
        id="vendidos"
        titulo="Mais vendidos da cidade"
        kicker="Quem compra, recomenda"
        icone="chart"
        verTodos="/ofertas?ord=vendidos"
        itens={itens(v.maisVendidos)}
      />

      <FaixaAnuncio anuncio={anuncios('M1')[0]} />

      <SecaoCarrossel
        id="ofertas"
        titulo="Melhores preços"
        kicker="Desconto de verdade"
        icone="tag"
        verTodos="/ofertas"
        itens={itens(v.melhoresPrecos)}
        patrocinadoPrimeiro
      />

      {v.confeccoes.length > 0 && (
        <section
          className="stitch relative my-[26px] rounded-xl bg-marinho px-[18px] py-[22px] [--r:24px]"
          aria-labelledby="h-moda"
        >
          <CabecalhoSecao
            id="moda"
            titulo={`Direto das confecções de ${t.nome}`}
            kicker="Capital do Vestuário"
            verTodos="/c/moda"
            textoVerTodos="Ver moda"
            claro
          />
          <Carrossel rotulo="Direto das confecções" setas={false}>
            {itens(v.confeccoes).map((it) => (
              <CartaoProduto key={it.produto.id} item={it} />
            ))}
          </Carrossel>
        </section>
      )}

      {v.emAlta.length > 0 && (
        <section className="my-[26px]" aria-labelledby="h-hot">
          <CabecalhoSecao id="hot" titulo="Em alta" kicker="Subindo agora" icone="fire" />
          <GradeProdutos>
            {itens(v.emAlta).map((it, i) => (
              <CartaoProduto key={it.produto.id} item={it} patrocinado={i === 0} />
            ))}
          </GradeProdutos>
        </section>
      )}

      <DuplaAnuncios anuncios={anuncios('M2')} />

      <section className="my-[26px]" aria-labelledby="h-lojas">
        <CabecalhoSecao
          id="lojas"
          titulo={`Lojas de ${t.nome}`}
          kicker="Comércio local"
          verTodos="/lojas"
          textoVerTodos="Ver todas"
        />
        {v.lojas.length ? (
          <GradeLojas>
            {v.lojas.map((l) => (
              <CartaoLoja key={l.id} loja={l} categoria={catPorId.get(l.categoriaId)} cidade={t.nome} />
            ))}
          </GradeLojas>
        ) : (
          <p className="m-0 text-grafite-2">As primeiras lojas de {t.nome} estão chegando.</p>
        )}
      </section>

      <section className="card my-[26px] flex flex-wrap items-center justify-between gap-4 border-borda-fria bg-azul-nevoa">
        <div className="flex flex-col gap-1">
          <h2>Tem loja em {t.nome}?</h2>
          <span className="text-grafite-2">
            Venda online para a cidade toda, com painel simples e apoio da {t.associacao}.
          </span>
        </div>
        <Link href="/vender" className="btn btn-primary btn-lg">
          Quero vender
        </Link>
      </section>
    </>
  );
}
