'use client';

import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantProvider';
import { CabecalhoPagina, CaixaVazia, StatusDisponibilidade } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { ArteProduto, capaDe } from '@/components/vitrine/ArteProduto';
import { BarraFreteGratis } from '@/components/vitrine/BarraFreteGratis';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { useSacolaDetalhada } from '@/hooks/useSacolaDetalhada';
import { reais } from '@/lib/regras/dinheiro';
import { totalItens, useComprador } from '@/stores/comprador';

/**
 * Sacola multiloja (protótipo: vSacola). O visitante monta sem conta; para fechar,
 * entra ou cria conta e a sacola é mantida (CLAUDE.md §5.4).
 */
export function Sacola() {
  const tenant = useTenant();
  const hidratado = useComprador((s) => s.hidratado);
  const itens = useComprador((s) => s.itens);
  const usuario = useComprador((s) => s.usuario);
  const { grupos, subtotal, carregando } = useSacolaDetalhada();
  const { alterarQuantidade, remover, avisar } = useComprador.getState();

  if (!hidratado || (carregando && itens.length)) return <div className="min-h-[50vh]" aria-busy="true" />;
  if (!itens.length)
    return (
      <CaixaVazia
        icone="bag"
        titulo="Sua sacola está vazia"
        texto={`Navegue pelas lojas de ${tenant.nome} e adicione o que quiser. Você não precisa de conta para montar a sacola.`}
        acao={
          <Link href="/" className="btn btn-primary">
            Começar a comprar
          </Link>
        }
      />
    );

  const n = grupos.length;
  return (
    <>
      <CabecalhoPagina
        titulo="Sacola"
        acao={
          <span className="text-[13px] text-grafite-2">
            {totalItens(itens)} itens de {n} loja{n > 1 ? 's' : ''}
          </span>
        }
      />
      <div className="mt-4 grid grid-cols-1 items-start gap-5 min-[960px]:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3.5">
          {n > 1 && (
            <div className="banner-info bg-azul-nevoa text-azul-escuro">
              <Icone nome="info" />
              <span>
                Compra em mais de uma loja: você paga tudo de uma vez e cada loja entrega ou separa a sua
                parte. O frete é por loja.
              </span>
            </div>
          )}
          {grupos.map((g) => (
            <div
              key={g.loja.id}
              className="overflow-hidden rounded-lg border border-solid border-borda bg-branco"
            >
              <div className="flex items-center gap-2.5 border-b border-solid border-borda bg-neutro-50 px-4 py-3.5">
                <AvatarLoja loja={g.loja} className="h-9 w-9 rounded-[10px] text-[13px]" />
                <b className="min-w-0 flex-1 leading-tight">{g.loja.nome}</b>
                <span className="text-xs text-grafite-2">
                  {g.loja.entrega ? `Entrega ${g.loja.prazo.toLowerCase()}` : ''}
                  {g.loja.retirada ? ' · retirada grátis' : ''}
                </span>
              </div>
              {g.loja.freteGratisAPartirDe !== null && (
                <div className="border-b border-solid border-borda px-4 py-2.5">
                  <BarraFreteGratis loja={g.loja} subtotal={g.subtotal} />
                </div>
              )}
              {g.linhas.map((l, i) => (
                <div
                  key={l.item.chave}
                  className={`flex items-center gap-3 px-4 py-3.5 ${i ? 'border-t border-solid border-borda' : ''}`}
                >
                  <Link href={`/p/${l.produto.id}`} aria-label={l.produto.nome} className="flex-none">
                    <ArteProduto
                      categoria={l.categoria}
                      className="!aspect-square h-[72px] w-[72px] rounded-[12px]"
                      src={capaDe(l.produto.midias)}
                      sizes="72px"
                      tamanhoIcone="h-1/2 w-1/2"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      href={`/p/${l.produto.id}`}
                      className="text-sm font-medium text-grafite hover:text-marinho"
                    >
                      {l.produto.nome}
                    </Link>
                    {l.item.opcao && l.produto.variacao && (
                      <span className="text-xs text-grafite-2">
                        {l.produto.variacao.nome}: {l.item.opcao}
                      </span>
                    )}
                    {l.itensDoKit.length > 0 && (
                      <span className="text-xs text-grafite-2">
                        Inclui: {l.itensDoKit.map((k) => `${k.quantidade}× ${k.nome}`).join(', ')}
                      </span>
                    )}
                    <StatusDisponibilidade disp={l.produto.disponibilidade} className="self-start" />
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="quantidade">
                        <button
                          type="button"
                          aria-label="Diminuir"
                          onClick={() => alterarQuantidade(l.item.chave, -1)}
                        >
                          <Icone nome="minus" />
                        </button>
                        <span aria-live="polite">{l.item.quantidade}</span>
                        <button
                          type="button"
                          aria-label="Aumentar"
                          onClick={() => alterarQuantidade(l.item.chave, 1)}
                        >
                          <Icone nome="plus" />
                        </button>
                      </div>
                      <b className="font-titulo text-lg text-marinho">
                        {reais(l.precoUnitario * l.item.quantidade)}
                      </b>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm self-start bg-transparent px-0 text-grafite-2"
                      onClick={() => {
                        remover(l.item.chave);
                        avisar('Item removido.');
                      }}
                    >
                      <Icone nome="trash" tamanho="sm" />
                      Remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <aside className="card flex flex-col gap-3 min-[960px]:sticky min-[960px]:top-[140px]">
          <h2>Resumo</h2>
          <div className="linha-resumo">
            <span>Produtos</span>
            <span>{reais(subtotal)}</span>
          </div>
          <div className="linha-resumo">
            <span>
              Frete ({n} loja{n > 1 ? 's' : ''})
            </span>
            <span>calculado no próximo passo</span>
          </div>
          <div className="total-resumo">
            <span>Total</span>
            <span>{reais(subtotal)}</span>
          </div>
          <Link
            href={usuario ? '/checkout' : '/entrar?next=checkout'}
            className="btn btn-primary btn-lg w-full"
          >
            Continuar a compra
          </Link>
          {!usuario && (
            <span className="text-center text-xs text-grafite-2">
              Para fechar a compra você entra ou cria sua conta. Sua sacola fica guardada.
            </span>
          )}
          <span className="flex items-center justify-center gap-1.5 text-xs text-grafite-2">
            <Icone nome="lock" tamanho="sm" />
            Pagamento protegido · Pix ou cartão
          </span>
        </aside>
      </div>
    </>
  );
}
