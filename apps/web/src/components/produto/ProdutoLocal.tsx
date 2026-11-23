'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { GaleriaProduto } from '@/components/produto/GaleriaProduto';
import { CaixaVazia } from '@/components/ui/Basicos';
import { reais } from '@/lib/regras/dinheiro';
import { produtoDaEdicao } from '@/lib/regras/vitrineLocal';
import { useCategorias } from '@/stores/categorias';
import { usePainel } from '@/stores/painel';
import type { Categoria, Loja } from '@/types/domain';

/** Produto aprovado na demonstração ainda existe somente no navegador. */
export function ProdutoLocal({
  id,
  categorias,
  lojas,
}: {
  id: string;
  categorias: Categoria[];
  lojas: Loja[];
}) {
  const cats = useCategorias(categorias);
  const hidratado = usePainel((s) => s.hidratado);
  const e = usePainel((s) => s.edicoes[id]);
  const estoque = usePainel((s) => s.estoque);
  const lojaId = usePainel((s) => s.lojaId);
  const reserva = usePainel((s) => s.integracao.reservaSeguranca);
  const visivel = usePainel((s) => s.visivel && s.status === 'aprovada');
  useEffect(() => {
    if (!usePainel.persist.hasHydrated()) void usePainel.persist.rehydrate();
  }, []);
  if (!hidratado) return <div className="min-h-[40vh]" aria-busy="true" />;
  const loja = lojas.find((l) => l.id === lojaId);
  const categoria = cats.find((c) => c.id === e?.atual.categoriaId);
  if (!e || e.novo || !loja || !categoria || !visivel)
    return (
      <CaixaVazia
        icone="box"
        titulo="Produto não encontrado"
        texto="Confira os produtos disponíveis."
        acao={
          <Link href="/categorias" className="btn btn-primary">
            Ver categorias
          </Link>
        }
      />
    );
  const p = produtoDaEdicao(id, lojaId, e, estoque, reserva);
  return (
    <div className="my-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GaleriaProduto midias={p.midias} categoria={categoria} />
      <section className="card flex flex-col gap-3">
        <Link href={`/c/${categoria.id}`}>{categoria.nome}</Link>
        <h1>{p.nome}</h1>
        <p className="text-xl font-bold">{reais(p.precoCentavos)}</p>
        <p>{e.atual.descricao}</p>
        <p>{loja.nome}</p>
        {p.variacao && (
          <p>
            <b>{p.variacao.nome}:</b> {p.variacao.opcoes.join(', ')}
          </p>
        )}
        {p.atributos?.map((a) => (
          <p key={`${a.nome}-${a.valor}`}>
            <b>{a.nome}:</b> {a.valor}
          </p>
        ))}
        <p className="banner-info bg-azul-nevoa text-azul-escuro">
          Produto aprovado nesta demonstração. A compra de produtos cadastrados no navegador depende da
          integração com o servidor.
        </p>
      </section>
    </div>
  );
}
