import { JsonLd } from '@/components/ui/JsonLd';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { GaleriaProduto } from '@/components/produto/GaleriaProduto';
import { PainelCompra } from '@/components/produto/PainelCompra';
import { ProdutoLocal } from '@/components/produto/ProdutoLocal';
import { StatusDisponibilidade } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { SecaoCarrossel } from '@/components/vitrine/SecaoCarrossel';
import { SeloLoja } from '@/components/vitrine/SeloLoja';
import { CategoriaNome, MigalhasProduto } from '@/components/vitrine/CategoriaNome';
import { ResumoAvaliacoes } from '@/components/vitrine/AvaliacoesLoja';
import { api } from '@/lib/api';
import { ROTULO_DISPONIBILIDADE } from '@/lib/regras/disponibilidade';
import { desconto, reais } from '@/lib/regras/dinheiro';
import { getTenant } from '@/lib/tenant';
import { montarItens } from '@/lib/vitrine';
import type { Disponibilidade } from '@/types/domain';

/** ISR: preço e estoque mudam na hora no back-end; a página é regenerada a cada 60 s. */
export const revalidate = 60;

type Props = { params: Promise<{ tenant: string; produto: string }> };

export async function generateStaticParams({ params }: { params: { tenant: string } }) {
  const ps = await api.produtos.buscar(params.tenant);
  return ps.map((p) => ({ produto: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, produto } = await params;
  const [t, d] = await Promise.all([getTenant(tenant), api.produtos.obter(tenant, produto)]);
  if (!d) return {};
  const descricao = `${d.produto.nome} por ${reais(d.produto.precoCentavos)} na ${d.loja.nome}, loja de ${t.nome}. Entrega ou retirada pelo ${t.marca}.`;
  return {
    title: d.produto.nome,
    description: descricao,
    alternates: { canonical: `/p/${d.produto.id}` },
    openGraph: { title: d.produto.nome, description: descricao, type: 'website', siteName: t.marca },
  };
}

const SCHEMA_DISP: Record<Disponibilidade, string> = {
  disponivel: 'https://schema.org/InStock',
  ultimas_unidades: 'https://schema.org/LimitedAvailability',
  indisponivel: 'https://schema.org/OutOfStock',
};

/** Página de produto (protótipo: vProduto). */
export default async function PaginaProduto({ params }: Props) {
  const { tenant: slug, produto: id } = await params;
  const [t, d, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.produtos.obter(slug, id),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  if (!d && id.startsWith('novo-')) return <ProdutoLocal id={id} categorias={categorias} lojas={lojas} />;
  if (!d) notFound();
  const { produto: p, loja, categoria: c } = d;
  const off = desconto(p);

  // Dados estruturados de produto para o Google (rich results).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.nome,
    sku: p.id,
    category: c.nome,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: (p.precoCentavos / 100).toFixed(2),
      availability: SCHEMA_DISP[p.disponibilidade],
      url: `/p/${p.id}`,
      seller: { '@type': 'Organization', name: loja.nome },
    },
  };

  return (
    <>
      <JsonLd dados={jsonLd} />
      <MigalhasProduto categoria={c} nome={p.nome} />

      <div className="mt-3.5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8">
        <div>
          <GaleriaProduto
            midias={p.midias}
            categoria={c}
            selos={
              (off > 0 || p.kit) && (
                <>
                  {off > 0 && <span className="pill pill-sale">−{off}%</span>}
                  {p.kit && (
                    <span className="pill pill-indicada">
                      {p.kit.tipo === 'aberto' ? 'Monte o seu kit' : 'Kit'}
                    </span>
                  )}
                </>
              )
            }
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="pill pill-local">
                <Icone nome="pin" tamanho="sm" />
                Loja de {t.nome}
              </span>
              <SeloLoja selo={loja.selo} />
              <StatusDisponibilidade disp={p.disponibilidade} />
            </div>
            <h1 className="leading-[1.2]">{p.nome}</h1>
            <Link href={`/loja/${loja.id}`} className="inline-flex items-center gap-1 text-[13px]">
              Vendido por <b>{loja.nome}</b>
            </Link>
            <ResumoAvaliacoes loja={lojas.find((l) => l.id === loja.id) ?? loja} />
          </div>

          <div className="flex flex-col gap-0.5">
            {p.precoDeCentavos && (
              <span className="text-grafite-2 line-through">{reais(p.precoDeCentavos)}</span>
            )}
            <div className="flex items-center gap-2.5">
              {p.kit?.tipo === 'aberto' && (
                <span className="text-sm font-semibold text-grafite-2">a partir de</span>
              )}
              <span className="preco-grande">{reais(p.precoCentavos)}</span>
              {off > 0 && <span className="pill pill-local text-[13px]">{off}% OFF</span>}
            </div>
            <span className="text-[13px] text-grafite-2">
              no Pix ou cartão · parcelamento conforme o provedor de pagamento
            </span>
          </div>

          {p.kit?.tipo === 'fechado' && (
            <div className="card flex flex-col gap-2">
              <h2 className="text-lg">O que vem no kit</h2>
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {p.kit.componentes.map((k) => {
                  const c = d.componentes.find((x) => x.id === k.produtoId);
                  return c ? (
                    <li key={k.produtoId} className="flex items-center justify-between gap-2.5 text-sm">
                      <Link href={`/p/${c.id}`} className="min-w-0 flex-1">
                        {k.quantidade}× {c.nome}
                      </Link>
                      <StatusDisponibilidade disp={c.disponibilidade} />
                    </li>
                  ) : null;
                })}
              </ul>
              <span className="text-xs text-grafite-2">
                O kit usa o estoque de cada item: se um acabar, o kit fica indisponível.
              </span>
            </div>
          )}

          <PainelCompra produto={p} loja={loja} componentes={d.componentes} />

          <div className="card flex items-center gap-3">
            <AvatarLoja loja={loja} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b>{loja.nome}</b>
              <span className="text-xs text-grafite-2">
                CNPJ {loja.cnpj} · {loja.bairro}, {t.nome}/{t.uf}
              </span>
            </div>
            <Link href={`/loja/${loja.id}`} className="btn btn-sm btn-soft">
              Ver loja
            </Link>
          </div>
        </div>
      </div>

      <section className="card my-[26px] flex flex-col gap-3">
        <h2>Descrição</h2>
        <p className="m-0 text-grafite-2">
          [Descrição do produto escrita pelo lojista. Conteúdo novo ou alterado passa por moderação antes de
          aparecer; preço e estoque atualizam na hora.]
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              ['Categoria', <CategoriaNome key={c.id} categoria={c} />],
              ['Disponibilidade', ROTULO_DISPONIBILIDADE[p.disponibilidade]],
              ['Garantia', 'Legal de 90 dias (CDC) + a do fabricante'],
              ['Nota fiscal', 'Emitida pela loja vendedora'],
            ] as Array<[string, ReactNode]>
          ).map(([k, v]) => (
            <div key={k} className="rounded-[12px] bg-neutro-100 px-3 py-2.5 text-[13px]">
              <b className="mb-0.5 block text-xs font-semibold text-grafite-2">{k}</b>
              {v}
            </div>
          ))}
        </div>
      </section>

      <SecaoCarrossel
        id="mais-loja"
        titulo={`Mais de ${loja.nome}`}
        itens={montarItens(d.relacionados, lojas, categorias)}
      />
    </>
  );
}
