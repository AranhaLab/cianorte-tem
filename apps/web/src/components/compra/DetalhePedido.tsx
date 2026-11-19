'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { api } from '@/lib/api';
import { MODO_DEMO } from '@/lib/demo';
import { reais } from '@/lib/regras/dinheiro';
import { FLUXO, ROTULO_STATUS } from '@/lib/regras/pedidos';
import { useComprador } from '@/stores/comprador';
import type { Loja } from '@/types/domain';

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  });

/** Pedido com pagamento (Pix/cartão) e linha do tempo por subpedido (protótipo: vPedido). */
export function DetalhePedido({ id }: { id: string }) {
  const tenant = useTenant();
  const pedido = useComprador((s) => s.pedidos.find((p) => p.id === id));
  const { confirmarPagamento, avisar } = useComprador.getState();
  const [lojas, setLojas] = useState<Loja[]>([]);
  useEffect(() => {
    void api.lojas.listar(tenant.slug).then(setLojas);
  }, [tenant.slug]);

  if (!pedido)
    return (
      <CaixaVazia
        icone="receipt"
        titulo="Pedido não encontrado"
        texto="Confira seus pedidos na sua conta."
        acao={
          <Link href="/conta/pedidos" className="btn btn-primary">
            Meus pedidos
          </Link>
        }
      />
    );

  const simular = () => {
    confirmarPagamento(pedido.id);
    avisar('Pagamento confirmado.');
  };

  return (
    <div className="mx-auto my-6 max-w-[760px]">
      <div className="flex flex-col gap-4 rounded-xl border border-solid border-borda bg-branco p-6">
        {pedido.pago ? (
          <div className="banner-info bg-verde-claro text-verde-texto">
            <Icone nome="check" />
            <span>
              <b>Pagamento confirmado!</b> As lojas já foram avisadas e começaram a separar seu pedido.
            </span>
          </div>
        ) : pedido.pagamento === 'pix' ? (
          <div className="flex flex-col gap-3">
            <h1>Pague com Pix para confirmar</h1>
            <div className="flex flex-wrap items-center gap-4">
              <QrDemonstrativo />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className="text-[13px] text-grafite-2">
                  Abra o app do seu banco e escaneie, ou copie o código:
                </span>
                <span className="break-all rounded-[8px] bg-neutro-200 px-2.5 py-1.5 font-mono text-[13px]">
                  00020126…{pedido.id}…6304
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm min-h-toque self-start"
                  onClick={() => avisar('Código Pix copiado.')}
                >
                  <Icone nome="copy" tamanho="sm" />
                  Copiar código
                </button>
                <span className="text-xs text-grafite-2">
                  Válido por 30 min.{' '}
                  {MODO_DEMO ? (
                    <>
                      Demonstração:{' '}
                      <button type="button" className="btn btn-sm btn-soft" onClick={simular}>
                        Simular pagamento
                      </button>
                    </>
                  ) : (
                    'A confirmação aparece aqui sozinha.'
                  )}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="banner-info bg-azul-nevoa text-azul-escuro">
            <Icone nome="clock" />
            <span>
              Aguardando a confirmação do cartão pelo provedor.{' '}
              {MODO_DEMO && (
                <button type="button" className="btn btn-sm btn-soft" onClick={simular}>
                  Simular aprovação
                </button>
              )}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2>Pedido nº {pedido.id}</h2>
          <span className="text-[13px] text-grafite-2">{dataHora(pedido.criadoEm)}</span>
        </div>

        {pedido.subpedidos.map((sp) => {
          const loja = lojas.find((l) => l.id === sp.lojaId);
          const fluxo = FLUXO[sp.modo];
          const atual = fluxo.indexOf(sp.status);
          return (
            <div key={sp.id} className="card flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b>
                  {sp.id} · {loja?.nome ?? '…'}
                </b>
                <span className={`pill ${sp.modo === 'entrega' ? 'pill-indicada' : 'pill-local'}`}>
                  {sp.modo === 'entrega' ? 'Entrega' : 'Retirada'}
                </span>
              </div>
              <ol className="m-0 flex list-none flex-col p-0">
                {fluxo.map((st, i) => (
                  <li
                    key={st}
                    aria-current={i === atual ? 'step' : undefined}
                    className={`relative flex gap-3 pb-3.5 text-sm before:z-[1] before:mt-1 before:h-3 before:w-3 before:flex-none before:rounded-full before:content-[''] after:absolute after:bottom-0 after:left-[5px] after:top-4 after:w-0.5 after:bg-neutro-300 after:content-[''] last:after:hidden ${
                      i < atual
                        ? 'before:bg-verde'
                        : i === atual
                          ? 'before:bg-azul before:shadow-[0_0_0_4px] before:shadow-azul-nevoa'
                          : 'before:bg-neutro-400'
                    }`}
                  >
                    <span>{ROTULO_STATUS[st]}</span>
                  </li>
                ))}
              </ol>
              <Link href="/conta/pedidos" className="btn btn-sm btn-ghost self-start">
                <Icone nome="receipt" tamanho="sm" />
                Chat com a loja (após a compra)
              </Link>
            </div>
          );
        })}

        <div className="total-resumo">
          <span>Total</span>
          <span>{reais(pedido.totalCentavos)}</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/conta/pedidos" className="btn btn-primary">
            Ver meus pedidos
          </Link>
          <Link href="/" className="btn btn-ghost">
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  );
}

/** QR ilustrativo (o real vem do provedor de pagamento). Mesmo desenho do protótipo. */
function QrDemonstrativo() {
  const fixos = [0, 1, 12, 13, 10, 11, 22, 23, 120, 121, 132, 133];
  return (
    <div
      aria-label="QR Code Pix (demonstração)"
      role="img"
      className="grid h-[150px] w-[150px] grid-cols-12 gap-0.5 rounded-[12px] border border-solid border-borda bg-branco p-2.5"
    >
      {Array.from({ length: 144 }, (_, i) => (
        <i
          key={i}
          className={`rounded-[1px] ${
            (i * 7 + (i >> 3) * 5) % 3 === 0 || fixos.includes(i) ? 'bg-marinho' : 'bg-transparent'
          }`}
        />
      ))}
    </div>
  );
}
