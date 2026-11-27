'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCaminho } from '@/hooks/useCaminho';
import { Marca } from '@/components/marca/Marca';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { AvatarLoja } from '@/components/vitrine/CartaoLoja';
import { useComprador } from '@/stores/comprador';
import { usePainel } from '@/stores/painel';
import { useSessaoLojista } from '@/stores/sessaoLojista';
import type { StatusCadastroLoja } from '@/types/domain';
import { useLojaExibida, useLojaPainel } from './PainelContexto';

const ITENS: Array<[string, NomeIcone, string]> = [
  ['', 'chart', 'Visão geral'],
  ['pedidos', 'receipt', 'Pedidos'],
  ['conversas', 'chat', 'Conversas'],
  ['produtos', 'tag', 'Produtos'],
  ['estoque', 'box', 'Estoque e integração'],
  ['anuncios', 'megaphone', 'Anúncios'],
  ['financeiro', 'card', 'Financeiro'],
  ['vitrine', 'sparkle', 'Vitrine da loja'],
  ['loja', 'store', 'Minha loja'],
  ['equipe', 'user', 'Equipe'],
  ['cadastro', 'doc', 'Cadastro e documentos'],
];

export const STATUS_LOJA: Record<StatusCadastroLoja, [string, string]> = {
  rascunho: ['Cadastro incompleto', 'st-gray'],
  em_analise: ['Em análise', 'st-amber'],
  aprovada: ['Aprovada', 'st-green'],
  reprovada: ['Reprovada', 'st-red'],
  suspensa: ['Suspensa', 'st-red'],
};

/** Menu lateral do painel (protótipo: panelLayout). */
export function MenuPainel() {
  const tenant = useTenant();
  const path = useCaminho();
  const { loja } = useLojaPainel();
  const status = usePainel((s) => s.status);
  const visivel = usePainel((s) => s.visivel);
  const lojaExibida = useLojaExibida();
  const ativo = path.replace(/^\/painel\/?/, '').split('/')[0] ?? '';
  const [rotulo, cor] = STATUS_LOJA[status];
  const atual = ITENS.find(([id]) => id === ativo)?.[2] ?? 'Menu';
  const [aberto, setAberto] = useState(false);
  useEffect(() => setAberto(false), [path]); // fecha ao trocar de tela

  return (
    <aside className="flex min-w-0 flex-[1_1_250px] flex-col gap-3 rounded-xl border border-solid border-borda-fria bg-branco px-3 py-2.5 shadow-1 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:flex-[0_0_260px] xl:gap-4 xl:overflow-y-auto xl:py-[18px] xl:[scrollbar-width:thin]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex shrink-0 flex-col gap-0.5 px-1.5">
          <Link href="/" aria-label={`${tenant.marca} — marketplace`}>
            <Marca nome={tenant.logo.nome} etiqueta={tenant.logo.etiqueta} escura />
          </Link>
          <span className="text-xs text-grafite-2">Painel do lojista</span>
        </span>
        {/* Celular e tablet: o menu abre por este botão, para o conteúdo vir logo no topo */}
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-toque min-w-0 shrink xl:hidden"
          aria-expanded={aberto}
          aria-controls="menu-painel"
          onClick={() => setAberto((v) => !v)}
        >
          <Icone nome={aberto ? 'x' : 'menu'} tamanho="sm" />
          <span className="min-w-0 truncate">{aberto ? 'Fechar' : atual}</span>
          <span className="sr-only"> — menu do painel</span>
        </button>
      </div>
      <div id="menu-painel" className={`${aberto ? 'flex' : 'hidden'} flex-col gap-4 xl:flex`}>
        <nav aria-label="Painel" className="flex flex-col gap-0.5">
          {ITENS.map(([id, icone, nome]) => {
            const on = ativo === id;
            return (
              <Link
                key={id}
                href={`/painel${id ? `/${id}` : ''}`}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-toque items-center gap-3 rounded-[14px] px-3 text-sm xl:min-h-10 ${
                  on
                    ? 'bg-marinho font-semibold text-branco hover:text-branco'
                    : 'font-medium text-grafite-2 hover:bg-linho hover:text-marinho'
                }`}
              >
                <Icone nome={icone} className={on ? 'text-azul-claro' : ''} />
                {nome}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2.5 border-t border-solid border-borda-fria px-1.5 pt-3.5">
          <div className="flex items-center gap-2.5">
            <AvatarLoja loja={lojaExibida} className="h-10 w-10 rounded-[12px] text-sm" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <b className="text-[13px]">{lojaExibida.nome}</b>
              <span className={`status ${cor} self-start px-2 py-0.5 text-[11px]`}>{rotulo}</span>
            </span>
          </div>
          <div className="flex items-center gap-2.5 rounded-[14px] bg-neutro-100 px-3 py-2.5">
            <span className="flex flex-1 flex-col">
              <b className="text-[13px]">Loja visível</b>
              <span className="text-xs text-grafite-2">
                {visivel ? 'Aparece para os compradores' : 'Oculta do marketplace'}
              </span>
            </span>
            <InterruptorVisivel />
          </div>
          <Link href={`/loja/${loja.id}`} className="btn btn-ghost btn-sm min-h-toque xl:min-h-9">
            <Icone nome="eye" tamanho="sm" />
            Ver minha vitrine
          </Link>
          <Link href="/" className="btn btn-sm min-h-toque bg-transparent text-grafite-2 xl:min-h-9">
            <Icone nome="home" tamanho="sm" />
            Voltar ao marketplace
          </Link>
          <button
            type="button"
            className="btn btn-sm min-h-toque bg-transparent text-grafite-2 xl:min-h-9"
            onClick={() => useSessaoLojista.getState().sair()}
          >
            <Icone nome="logout" tamanho="sm" />
            Sair do painel
          </button>
        </div>
      </div>
    </aside>
  );
}

/** "Loja visível no marketplace": só liga com cadastro aprovado (CLAUDE.md §7.2). */
export function InterruptorVisivel({
  desabilitarSeNaoAprovada = false,
}: {
  desabilitarSeNaoAprovada?: boolean;
}) {
  const visivel = usePainel((s) => s.visivel);
  const status = usePainel((s) => s.status);
  const alternar = () => {
    const { avisar } = useComprador.getState();
    if (usePainel.getState().alternarVisivel() === 'nao_aprovada')
      return avisar('A loja só pode ficar visível depois da aprovação.');
    avisar(usePainel.getState().visivel ? 'Loja visível no marketplace.' : 'Loja oculta.');
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={visivel}
      aria-label="Loja visível no marketplace"
      className="interruptor"
      disabled={desabilitarSeNaoAprovada && status !== 'aprovada'}
      onClick={alternar}
    />
  );
}
