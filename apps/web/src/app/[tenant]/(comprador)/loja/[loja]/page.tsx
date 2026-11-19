import { JsonLd } from '@/components/ui/JsonLd';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Migalhas } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { BotaoSeguirLoja } from '@/components/vitrine/BotaoSeguirLoja';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { SeloLoja } from '@/components/vitrine/SeloLoja';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';
import { montarItens } from '@/lib/vitrine';

export const revalidate = 300;

type Props = { params: Promise<{ tenant: string; loja: string }> };

export async function generateStaticParams({ params }: { params: { tenant: string } }) {
  const lojas = await api.lojas.listar(params.tenant);
  return lojas.map((l) => ({ loja: l.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant, loja } = await params;
  const [t, d] = await Promise.all([getTenant(tenant), api.lojas.obter(tenant, loja)]);
  if (!d) return {};
  return {
    title: d.loja.nome,
    description: `${d.loja.nome}, loja de ${t.nome} (${d.loja.bairro}). Compre online com entrega ou retirada pelo ${t.marca}.`,
    alternates: { canonical: `/loja/${d.loja.id}` },
  };
}

/** Página da loja (protótipo: vLoja). Identifica o fornecedor (Decreto 7.962/2013). */
export default async function PaginaLoja({ params }: Props) {
  const { tenant: slug, loja: id } = await params;
  const [t, d, categorias] = await Promise.all([
    getTenant(slug),
    api.lojas.obter(slug, id),
    api.categorias.listar(slug),
  ]);
  if (!d) notFound();
  const { loja: l, produtos } = d;
  const cat = categorias.find((c) => c.id === l.categoriaId);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: l.nome,
    address: { '@type': 'PostalAddress', addressLocality: t.nome, addressRegion: t.uf, addressCountry: 'BR' },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: l.nota, reviewCount: l.avaliacoes },
  };

  return (
    <>
      <JsonLd dados={jsonLd} />
      <Migalhas
        itens={[{ rotulo: 'Início', href: '/' }, { rotulo: 'Lojas', href: '/lojas' }, { rotulo: l.nome }]}
      />

      <div className="card stitch mt-3 flex flex-wrap items-center gap-4 p-[22px] [--r:24px]">
        <AvatarLoja loja={l} className="h-[76px] w-[76px] rounded-[22px] text-[26px]" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1>{l.nome}</h1>
            <SeloLoja selo={l.selo} />
          </div>
          <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-grafite-2">
            <Icone nome="star" tamanho="sm" />
            {l.nota.toFixed(1)} ({l.avaliacoes} avaliações) · {l.bairro}, {t.nome}
            {cat ? ` · ${cat.nome}` : ''}
          </span>
          <div className="flex flex-wrap gap-2.5">
            <span className="pill pill-local">
              <Icone nome="pin" tamanho="sm" />
              Loja de {t.nome}
            </span>
            {l.entrega && (
              <span className="pill pill-indicada">
                <Icone nome="truck" tamanho="sm" />
                Entrega · {l.prazo}
              </span>
            )}
            {l.retirada && (
              <span className="pill pill-indicada">
                <Icone nome="store" tamanho="sm" />
                Retirada grátis
              </span>
            )}
          </div>
        </div>
        <BotaoSeguirLoja />
      </div>

      <section className="my-[26px]">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <h2>Produtos da loja</h2>
          <span className="text-[13px] text-grafite-2">{produtos.length} itens</span>
        </div>
        <GradeProdutos>
          {montarItens(produtos, [l], categorias).map((it) => (
            <CartaoProduto key={it.produto.id} item={it} />
          ))}
        </GradeProdutos>
      </section>

      <div className="legal-box flex items-start gap-1.5">
        <Icone nome="info" tamanho="sm" />
        <span>
          Fornecedor: <b>{l.nome}</b> · CNPJ {l.cnpj} · {l.bairro}, {t.nome}/{t.uf} · Atendimento pelo chat do
          pedido.
        </span>
      </div>
    </>
  );
}
