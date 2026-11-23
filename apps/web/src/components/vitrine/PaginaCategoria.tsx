'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import {
  AnuncioLateral,
  AnuncioNaGrade,
  AnuncioTopoCategoria,
} from '@/components/anuncios/AnunciosCategoria';
import { CaixaVazia, Migalhas } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { ChipsSubcategoria, FiltrosAtivos } from '@/components/vitrine/FiltrosAtivos';
import { FiltrosVitrine } from '@/components/vitrine/FiltrosVitrine';
import { PainelFiltros } from '@/components/vitrine/PainelFiltros';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { SecaoCarrossel } from '@/components/vitrine/SecaoCarrossel';
import { montarItens } from '@/lib/vitrine';
import { useCategorias } from '@/stores/categorias';
import { usePainel } from '@/stores/painel';
import { facetasDaLista, filtrarProdutos, mesclarProdutos } from '@/lib/regras/vitrineLocal';
import type { Filtro, FiltrosLaterais, Ordem, VitrineCategoria } from '@/lib/api';
import type { Categoria, Loja, Produto, Tenant } from '@/types/domain';

export function PaginaCategoriaCliente({
  id,
  inicial,
  t,
  lojas,
  categorias,
  produtosBase,
  ord,
  f,
  laterais,
}: {
  id: string;
  inicial: VitrineCategoria | null;
  t: Tenant;
  lojas: Loja[];
  categorias: Categoria[];
  produtosBase: Produto[];
  ord: Ordem;
  f?: Filtro;
  laterais: FiltrosLaterais;
}) {
  const atuais = useCategorias(categorias);
  const edicoes = usePainel((s) => s.edicoes);
  const estoque = usePainel((s) => s.estoque);
  const lojaId = usePainel((s) => s.lojaId);
  const lojaPublicada = usePainel((s) => s.status === 'aprovada' && s.visivel);
  const reserva = usePainel((s) => s.integracao.reservaSeguranca);
  useEffect(() => {
    if (!usePainel.persist.hasHydrated()) void usePainel.persist.rehydrate();
    const atualizar = (evento: StorageEvent) => { if (evento.key === 'ct-painel-v1') void usePainel.persist.rehydrate(); };
    window.addEventListener('storage', atualizar);
    return () => window.removeEventListener('storage', atualizar);
  }, []);
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);
  const c = atuais.find((categoria) => categoria.id === id);
  useEffect(() => {
    if (c) document.title = `${c.nome} · ${t.marca}`;
  }, [c, t.marca]);
  if (!c) {
    if (!pronto) return <div className="min-h-[40vh]" aria-busy="true" />;
    return (
      <CaixaVazia
        icone="grid"
        titulo="Categoria não encontrada"
        texto="Confira as categorias disponíveis."
        acao={
          <Link href="/categorias" className="btn btn-primary">
            Ver categorias
          </Link>
        }
      />
    );
  }
  const modelo: VitrineCategoria = inicial ?? {
    categoria: c,
    produtos: [],
    facetas: { marcas: [], lojas: [], caracteristicas: [], preco: { min: 0, max: 0 } },
    subcategoriasComProdutos: [],
    total: 0,
    maisVendidos: [],
    melhoresPrecos: [],
    lojas: [],
    anuncios: [],
  };
  const todos = mesclarProdutos(produtosBase, edicoes, lojaId, estoque, reserva, lojaPublicada && lojas.some((l) => l.id === lojaId)).filter((p) => p.categoriaId === id);
  const daSub = todos.filter((p) => !laterais.sub || p.subcategoriaId === laterais.sub);
  const v: VitrineCategoria = { ...modelo, produtos: filtrarProdutos(todos, lojas, laterais, f, ord), facetas: facetasDaLista(daSub, lojas), total: todos.length, maisVendidos: filtrarProdutos(todos, lojas), melhoresPrecos: filtrarProdutos(todos, lojas, {}, undefined, 'menor'), lojas: lojas.filter((l) => todos.some((p) => p.lojaId === l.id)) };
  const itens = (ps: typeof v.produtos) => montarItens(ps, lojas, atuais);
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

      <div className="stitch relative mt-3.5 flex items-center gap-4 overflow-hidden rounded-xl bg-marinho-2 p-[22px] [--r:24px]">
        <span className="flex h-16 w-16 flex-none items-center justify-center rounded-[20px] bg-branco text-marinho">
          <Icone nome={c.icone} tamanho="lg" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-branco">{c.nome}</h1>
          <span className="text-branco">
            {c.destaque} · {v.total} produtos de lojas de {t.nome}
          </span>
        </div>
      </div>

      <AnuncioTopoCategoria anuncio={k1} categoria={c.nome} />

      {v.total > 0 && (
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
          <ChipsSubcategoria
            base={`/c/${id}`}
            subs={c.subcategorias}
            atual={laterais.sub}
            manter={{ ord, f }}
          />
          <FiltrosVitrine base={`/c/${id}`} ord={ord} f={f} laterais={laterais}>
            <PainelFiltros base={`/c/${id}`} facetas={v.facetas} atuais={laterais} manter={{ ord, f }} />
          </FiltrosVitrine>
          <FiltrosAtivos base={`/c/${id}`} atuais={laterais} facetas={v.facetas} manter={{ ord, f }} />
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
              titulo={v.total === 0 ? 'Nenhum produto nesta categoria' : 'Nenhum produto com esse filtro'}
              texto={
                v.total === 0
                  ? 'Os produtos aparecerão aqui quando forem publicados.'
                  : 'Tente remover algum filtro.'
              }
            />
          )}
          {lista.length <= 5 && l1 && <AnuncioNaGrade anuncio={l1} />}
          {v.anuncioComplementar && <AnuncioNaGrade anuncio={v.anuncioComplementar} />}
        </div>

        <aside
          aria-label="Publicidade e lojas"
          className="hidden flex-col gap-4 self-start xl:sticky xl:top-[130px] xl:flex"
        >
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
          {l1 && <AnuncioLateral anuncio={l1} />}
          {v.anuncioComplementar && <AnuncioLateral anuncio={v.anuncioComplementar} />}
        </aside>
      </div>
    </>
  );
}
