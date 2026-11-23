'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Marca } from '@/components/marca/Marca';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { useCaminho } from '@/hooks/useCaminho';
import { usePendencias } from './Comum';

const ITENS: Array<[string, NomeIcone, string]> = [
  ['', 'chart', 'Visão geral'],
  ['lojas', 'store', 'Lojas e filiais'],
  ['moderacao', 'eye', 'Moderação'],
  ['pedidos', 'receipt', 'Pedidos'],
  ['financeiro', 'card', 'Financeiro'],
  ['regras', 'filter', 'Regras da cidade'],
  ['categorias', 'grid', 'Categorias'],
  ['acesso', 'eye', 'Telas de acesso'],
  ['auditoria', 'lock', 'Auditoria'],
];

/** Menu lateral da administração da plataforma (CLAUDE.md §16). */
export function MenuAdmin() {
  const tenant = useTenant();
  const path = useCaminho();
  const p = usePendencias();
  const ativo = path.replace(/^\/admin\/?/, '').split('/')[0] ?? '';
  const atual = ITENS.find(([id]) => id === ativo)?.[2] ?? 'Menu';
  const [aberto, setAberto] = useState(false);
  useEffect(() => setAberto(false), [path]); // fecha ao trocar de tela
  const contagem: Record<string, number> = {
    lojas: p.cadastros + p.filiais,
    moderacao: p.produtos,
    pedidos: p.pedidos,
  };

  return (
    <aside className="flex min-w-0 flex-[1_1_250px] flex-col gap-3 rounded-xl border border-solid border-borda-fria bg-branco px-3 py-2.5 shadow-1 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:flex-[0_0_260px] xl:gap-4 xl:overflow-y-auto xl:py-[18px] xl:[scrollbar-width:thin]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex shrink-0 flex-col gap-0.5 px-1.5">
          <Link href="/" aria-label={`${tenant.marca} — marketplace`}>
            <Marca nome={tenant.nome} escura />
          </Link>
          <span className="text-xs text-grafite-2">Administração da plataforma</span>
        </span>
        {/* Celular e tablet: o menu abre por este botão, para o conteúdo vir logo no topo */}
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-toque min-w-0 shrink xl:hidden"
          aria-expanded={aberto}
          aria-controls="menu-admin"
          onClick={() => setAberto((v) => !v)}
        >
          <Icone nome={aberto ? 'x' : 'menu'} tamanho="sm" />
          <span className="min-w-0 truncate">{aberto ? 'Fechar' : atual}</span>
          <span className="sr-only"> — menu da administração</span>
        </button>
      </div>
      <div id="menu-admin" className={`${aberto ? 'flex' : 'hidden'} flex-col gap-4 xl:flex`}>
        <nav aria-label="Administração" className="flex flex-col gap-0.5">
          {ITENS.map(([id, icone, nome]) => {
            const on = ativo === id;
            const n = contagem[id] ?? 0;
            return (
              <Link
                key={id}
                href={`/admin${id ? `/${id}` : ''}`}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-toque items-center gap-3 rounded-[14px] px-3 text-sm xl:min-h-10 ${
                  on
                    ? 'bg-marinho font-semibold text-branco hover:text-branco'
                    : 'font-medium text-grafite-2 hover:bg-linho hover:text-marinho'
                }`}
              >
                <Icone nome={icone} className={on ? 'text-azul-claro' : ''} />
                <span className="flex-1">{nome}</span>
                {n > 0 && (
                  <span className="rounded-full bg-acento px-2 py-0.5 text-xs font-bold text-branco">
                    {n}
                    <span className="sr-only"> pendentes</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-2 border-t border-solid border-borda-fria px-1.5 pt-3.5">
          <span className="text-xs text-grafite-2">
            {tenant.marca} · parceria {tenant.associacao}
          </span>
          <Link href="/" className="btn btn-sm min-h-toque bg-transparent text-grafite-2">
            <Icone nome="logout" tamanho="sm" />
            Voltar ao marketplace
          </Link>
        </div>
      </div>
    </aside>
  );
}
