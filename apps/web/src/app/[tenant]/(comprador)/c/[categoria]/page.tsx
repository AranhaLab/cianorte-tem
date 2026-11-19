import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Fragment } from 'react';
import {
  AnuncioLateral,
  AnuncioNaGrade,
  AnuncioTopoCategoria,
} from '@/components/anuncios/AnunciosCategoria';
import { CaixaVazia, Migalhas } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { FiltrosVitrine, lerFiltros } from '@/components/vitrine/FiltrosVitrine';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { SecaoCarrossel } from '@/components/vitrine/SecaoCarrossel';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';
import { montarItens } from '@/lib/vitrine';

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

/**
 * Página de categoria (protótipo: vCategoria). Renderizada no servidor a cada
 * requisição porque ordenação e filtros vêm da URL. Mesma lógica da home:
 * K1 no topo, Mais vendidos, Melhores preços, todos os produtos e L1 lateral.
 */
export default async function PaginaCategoria({ params, searchParams }: Props) {
  const { tenant: slug, categoria: id } = await params;
  const { ord, f } = lerFiltros(await searchParams);
  const [t, v, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.vitrine.categoria(slug, id, { ord, f }),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  if (!v) notFound();

  const c = v.categoria;
  const itens = (ps: typeof v.produtos) => montarItens(ps, lojas, categorias);
  const k1 = v.anuncios.find((a) => a.vaga === 'K1');
  const l1 = v.anuncios.find((a) => a.vaga === 'L1');
  const lista = itens(v.produtos);

  return (
    <>
      <Migalhas
        itens={[
          { rotulo: 'Início', href: '/' },
          { rotulo: 'Categorias', href: '/categorias' },
          { rotulo: c.nome },
        ]}
      />

      <div
        className="stitch relative mt-3.5 flex items-center gap-4 overflow-hidden rounded-xl p-[22px] [--r:24px]"
        style={{ backgroundColor: c.tom }}
      >
        <span className="flex h-16 w-16 flex-none items-center justify-center rounded-[20px] bg-branco text-marinho">
          <Icone nome={c.icone} tamanho="lg" />
        </span>
        <div className="flex flex-col gap-1">
          <h1>{c.nome}</h1>
          <span className="text-grafite-2">
            {c.destaque} · {v.total} produtos de lojas de {t.nome}
          </span>
        </div>
      </div>

      <AnuncioTopoCategoria anuncio={k1} categoria={c.nome} />

      {v.total > 3 && (
        <>
          <SecaoCarrossel
            id={`cv-${id}`}
            titulo={`Mais vendidos em ${c.nome.toLowerCase()}`}
            icone="chart"
            itens={itens(v.maisVendidos)}
          />
          <SecaoCarrossel
            id={`cb-${id}`}
            titulo="Melhores preços"
            icone="tag"
            itens={itens(v.melhoresPrecos)}
            patrocinadoPrimeiro
          />
        </>
      )}

      <div className="my-[26px] grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2>Todos os produtos</h2>
            <span className="text-[13px] text-grafite-2">{lista.length} resultados</span>
          </div>
          <FiltrosVitrine base={`/c/${id}`} ord={ord} f={f} />
          {lista.length ? (
            <GradeProdutos>
              {lista.map((it, i) => (
                <Fragment key={it.produto.id}>
                  <CartaoProduto item={it} />
                  {i === 5 && l1 && <AnuncioNaGrade anuncio={l1} />}
                </Fragment>
              ))}
            </GradeProdutos>
          ) : (
            <CaixaVazia
              icone="filter"
              titulo="Nenhum produto com esse filtro"
              texto="Tente remover algum filtro."
            />
          )}
        </div>

        <aside
          aria-label="Publicidade e lojas"
          className="hidden flex-col gap-4 self-start xl:sticky xl:top-[130px] xl:flex"
        >
          {l1 && <AnuncioLateral anuncio={l1} />}
          {v.lojas.length > 0 && (
            <div className="card flex flex-col gap-2">
              <b>Lojas desta categoria</b>
              {v.lojas.map((l) => (
                <Link
                  key={l.id}
                  href={`/loja/${l.id}`}
                  className="flex min-h-toque items-center gap-2.5 text-[13px]"
                >
                  <AvatarLoja loja={l} className="h-8 w-8 rounded-[10px] text-xs" />
                  {l.nome}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
