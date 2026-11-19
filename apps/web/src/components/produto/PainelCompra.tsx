'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { reais } from '@/lib/regras/dinheiro';
import { cepAtendido, freteBase, podeRetirar } from '@/lib/regras/frete';
import { escolhaValida, precoKitAberto } from '@/lib/regras/kits';
import { tamanhoLegivel } from '@/lib/regras/posVenda';
import { StatusDisponibilidade } from '@/components/ui/Basicos';
import { useComprador } from '@/stores/comprador';
import type { Loja, Produto } from '@/types/domain';

const QTD_MAX = 10;

/**
 * Parte interativa da página de produto: variação obrigatória, quantidade,
 * compra, cobertura pelo CEP e barra de compra fixa no celular.
 * Regras: CLAUDE.md §5.2 e §5.3. Fora da cobertura a compra fica bloqueada
 * também por acesso direto à URL (e o servidor revalida no checkout).
 */
export function PainelCompra({
  produto: p,
  loja,
  componentes = [],
}: {
  produto: Produto;
  loja: Loja;
  /** Kit aberto: produtos que o comprador pode escolher. */
  componentes?: Produto[];
}) {
  const tenant = useTenant();
  const router = useRouter();
  const [opcao, setOpcao] = useState<string | null>(null);
  const [qtd, setQtd] = useState(1);
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const kitAberto = p.kit?.tipo === 'aberto' ? p.kit : null;
  const precoKit = kitAberto
    ? precoKitAberto(
        componentes
          .filter((c) => escolhidos.includes(c.id))
          .map((c) => ({ precoCentavos: c.precoCentavos, quantidade: 1 })),
        kitAberto.descontoPercentual,
      )
    : 0;
  const somaSemDesconto = componentes
    .filter((c) => escolhidos.includes(c.id))
    .reduce((a, c) => a + c.precoCentavos, 0);
  const cep = useComprador((s) => (s.hidratado && s.cep) || tenant.cepPadrao);
  const { adicionar, avisar, abrir } = useComprador.getState();

  const naCidade = cepAtendido(tenant, cep);
  // Digital não depende do CEP: não tem entrega física (PRD-15) [PROPOSTA].
  const bloqueado = p.disponibilidade === 'indisponivel' || (!naCidade && !p.digital);
  const entrega = loja.entrega && naCidade;
  const retirada = podeRetirar(loja, naCidade);

  const comprar = (irParaSacola: boolean) => {
    if (kitAberto) {
      if (!escolhaValida(kitAberto, escolhidos)) {
        avisar(`Escolha de ${kitAberto.minimoItens} a ${kitAberto.maximoItens} itens para montar o kit.`);
        return;
      }
      const composicao = escolhidos.map((produtoId) => ({ produtoId, quantidade: 1 }));
      adicionar(p.id, null, qtd, `${p.nome} (${escolhidos.length} itens)`, composicao);
      if (irParaSacola) router.push('/sacola');
      return;
    }
    if (p.variacao && !opcao) {
      avisar(`Escolha ${p.variacao.nome.toLowerCase()} antes de adicionar.`);
      return;
    }
    adicionar(p.id, opcao, qtd, opcao ? `${p.nome} (${opcao})` : p.nome);
    if (irParaSacola) router.push('/sacola');
  };

  const alternar = (id: string) =>
    setEscolhidos((e) =>
      e.includes(id)
        ? e.filter((x) => x !== id)
        : kitAberto && e.length >= kitAberto.maximoItens
          ? e
          : [...e, id],
    );

  return (
    <>
      {kitAberto && (
        <fieldset className="card m-0 flex flex-col gap-2.5">
          <legend className="contents">
            <h2 className="text-lg">Monte o seu kit</h2>
          </legend>
          <span className="text-[13px] text-grafite-2">
            Escolha de {kitAberto.minimoItens} a {kitAberto.maximoItens} itens ·{' '}
            {kitAberto.descontoPercentual}% de desconto sobre a soma. Cada item sai do estoque dele.
          </span>
          {componentes.map((c) => {
            const esgotado = c.disponibilidade === 'indisponivel';
            const marcado = escolhidos.includes(c.id);
            const cheio = !marcado && escolhidos.length >= kitAberto.maximoItens;
            return (
              <label key={c.id} className="cartao-opcao items-center">
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={esgotado || cheio}
                  onChange={() => alternar(c.id)}
                />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <b className="text-sm">{c.nome}</b>
                  <StatusDisponibilidade disp={c.disponibilidade} className="self-start" />
                </span>
                <span className="font-titulo font-bold text-marinho">{reais(c.precoCentavos)}</span>
              </label>
            );
          })}
          <div
            className="flex items-baseline justify-between gap-2 border-t border-solid border-borda pt-2.5"
            aria-live="polite"
          >
            <span className="text-sm">
              {escolhidos.length} de {kitAberto.maximoItens} escolhidos
            </span>
            <span className="flex items-baseline gap-2">
              {escolhidos.length > 0 && (
                <s className="text-[13px] text-grafite-2">{reais(somaSemDesconto)}</s>
              )}
              <b className="font-titulo text-xl text-marinho">Seu kit: {reais(precoKit)}</b>
            </span>
          </div>
        </fieldset>
      )}

      {p.variacao && (
        <div className="flex flex-col gap-2">
          <span className="rotulo">
            {p.variacao.nome}: <b>{opcao ?? 'escolha uma opção'}</b>
          </span>
          <div role="group" aria-label={p.variacao.nome} className="flex flex-wrap gap-2.5">
            {p.variacao.opcoes.map((o) => (
              <button
                key={o}
                type="button"
                className="opcao"
                aria-pressed={opcao === o}
                onClick={() => setOpcao(o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="quantidade" aria-label="Quantidade">
          <button type="button" aria-label="Diminuir" onClick={() => setQtd((q) => Math.max(1, q - 1))}>
            <Icone nome="minus" />
          </button>
          <span aria-live="polite">{qtd}</span>
          <button type="button" aria-label="Aumentar" onClick={() => setQtd((q) => Math.min(QTD_MAX, q + 1))}>
            <Icone nome="plus" />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-primary btn-lg flex-1"
          disabled={bloqueado}
          onClick={() => comprar(false)}
        >
          <Icone nome="bag" />
          Adicionar à sacola
        </button>
      </div>
      <button
        type="button"
        className="btn btn-dark btn-lg"
        disabled={bloqueado}
        onClick={() => comprar(true)}
      >
        Comprar agora
      </button>

      {!naCidade && !p.digital && (
        <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
          <Icone nome="alert" />
          <span>
            O CEP <b>{cep}</b> está fora da área atendida pelas lojas de {tenant.nome}.{' '}
            <button type="button" className="btn btn-sm btn-ghost mt-1.5" onClick={() => abrir('cep')}>
              Trocar CEP
            </button>
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-[16px] border border-solid border-borda bg-branco [&>div+div]:border-t [&>div+div]:border-solid [&>div+div]:border-borda">
        {p.digital ? (
          <div className="flex items-start gap-3 p-3.5">
            <Icone nome="download" tamanho="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b>Entrega digital · sem frete</b>
              <span className="text-[13px] text-grafite-2">
                Arquivo {p.digital.formato} ({tamanhoLegivel(p.digital.tamanhoBytes)}) liberado em Conta ›
                Downloads assim que o pagamento for confirmado · até {p.digital.limiteDownloads} downloads em{' '}
                {p.digital.validadeDias} dias.
              </span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 p-3.5">
              <Icone nome="truck" tamanho="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b>Entrega {entrega ? `· ${loja.prazo}` : 'indisponível'}</b>
                <span className="text-[13px] text-grafite-2">
                  {entrega
                    ? `Frete estimado ${reais(freteBase(loja))} para ${cep} (calculado pela distância nas ruas × tarifa da loja)`
                    : 'Fora da cobertura desta loja'}
                </span>
              </div>
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => abrir('cep')}>
                Alterar
              </button>
            </div>
            <div className="flex items-start gap-3 p-3.5">
              <Icone nome="store" tamanho="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b>{retirada ? 'Retirada grátis na loja' : 'Retirada indisponível'}</b>
                <span className="text-[13px] text-grafite-2">
                  {loja.retirada
                    ? `${loja.bairro}, ${tenant.nome} · somente para compradores da mesma cidade`
                    : 'Esta loja não oferece retirada'}
                </span>
              </div>
            </div>
          </>
        )}
        <div className="flex items-start gap-3 p-3.5">
          <Icone nome="refresh" tamanho="lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <b>7 dias para desistir</b>
            <span className="text-[13px] text-grafite-2">
              Devolução gratuita por arrependimento em compras online (art. 49 do CDC).
            </span>
          </div>
        </div>
      </div>

      {/* Barra de compra fixa no celular: ocupa o lugar da barra inferior */}
      <div className="fixed inset-x-0 bottom-0 z-[41] flex items-center gap-2.5 border-t border-solid border-borda bg-branco px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 lg:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-grafite-2">
            {p.precoDeCentavos ? <s>{reais(p.precoDeCentavos)}</s> : ' '}
          </span>
          <b className="font-titulo text-xl text-marinho">
            {reais(kitAberto && escolhidos.length ? precoKit : p.precoCentavos)}
          </b>
        </div>
        <button type="button" className="btn btn-primary" disabled={bloqueado} onClick={() => comprar(false)}>
          <Icone nome="bag" />
          Adicionar
        </button>
      </div>
    </>
  );
}
