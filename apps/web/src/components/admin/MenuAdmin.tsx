'use client';

import Link from 'next/link';
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
  ['auditoria', 'lock', 'Auditoria'],
];

/** Menu lateral da administração da plataforma (CLAUDE.md §16). */
export function MenuAdmin() {
  const tenant = useTenant();
  const path = useCaminho();
  const p = usePendencias();
  const ativo = path.replace(/^\/admin\/?/, '').split('/')[0] ?? '';
  const contagem: Record<string, number> = {
    lojas: p.cadastros + p.filiais,
    moderacao: p.produtos,
    pedidos: p.pedidos,
  };

  return (
    <aside className="flex flex-[1_1_250px] flex-col gap-4 rounded-xl border border-solid border-borda-fria bg-branco px-3 py-[18px] shadow-1 xl:sticky xl:top-4 xl:flex-[0_0_260px]">
      <Link href="/" aria-label={`${tenant.marca} — marketplace`} className="px-1.5">
        <Marca nome={tenant.nome} escura />
      </Link>
      <span className="-mt-2.5 px-1.5 text-xs text-grafite-2">Administração da plataforma</span>
      <nav aria-label="Administração" className="flex flex-col gap-0.5">
        {ITENS.map(([id, icone, nome]) => {
          const on = ativo === id;
          const n = contagem[id] ?? 0;
          return (
            <Link
              key={id}
              href={`/admin${id ? `/${id}` : ''}`}
              aria-current={on ? 'page' : undefined}
              className={`flex min-h-toque items-center gap-3 rounded-[14px] px-3 text-sm ${
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
    </aside>
  );
}
