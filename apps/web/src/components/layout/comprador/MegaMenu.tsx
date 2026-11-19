'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { Categoria } from '@/types/domain';

/**
 * Mega menu do desktop (protótipo anterior, CLAUDE.md §16): categorias à esquerda;
 * passar o mouse ou focar uma categoria mostra as subcategorias à direita.
 * No celular continua o modal de categorias (barra inferior › Categorias).
 */
export function MegaMenu({ categorias, aoFechar }: { categorias: Categoria[]; aoFechar: () => void }) {
  const [ativa, setAtiva] = useState(categorias[0]?.id);
  const caixa = useRef<HTMLDivElement>(null);
  const atual = categorias.find((c) => c.id === ativa) ?? categorias[0];

  useEffect(() => {
    caixa.current?.querySelector<HTMLElement>('a')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [aoFechar]);

  if (!atual) return null;
  return (
    <div
      ref={caixa}
      id="mega-menu"
      role="region"
      aria-label="Todas as categorias"
      className="absolute left-4 right-4 top-full z-40 mt-1 grid grid-cols-[280px_minmax(0,1fr)] overflow-hidden rounded-[18px] border border-solid border-borda bg-branco text-grafite shadow-2"
    >
      <ul className="m-0 flex list-none flex-col gap-0.5 border-r border-solid border-borda bg-neutro-50 p-2">
        {categorias.map((c) => (
          <li key={c.id}>
            <Link
              href={`/c/${c.id}`}
              onMouseEnter={() => setAtiva(c.id)}
              onFocus={() => setAtiva(c.id)}
              onClick={aoFechar}
              aria-current={c.id === atual.id ? 'true' : undefined}
              className={`flex min-h-toque items-center gap-2.5 rounded-[12px] px-3 text-sm font-medium ${
                c.id === atual.id ? 'bg-branco text-marinho shadow-1' : 'text-grafite-2 hover:text-marinho'
              }`}
            >
              <Icone nome={c.icone} />
              <span className="flex-1">{c.nome}</span>
              <Icone nome="chevR" tamanho="sm" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg">{atual.nome}</h3>
            <span className="text-[13px] text-grafite-2">{atual.destaque}</span>
          </div>
          <Link href={`/c/${atual.id}`} onClick={aoFechar} className="btn btn-soft btn-sm whitespace-nowrap">
            Ver tudo em {atual.nome.toLowerCase()}
          </Link>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 2xl:grid-cols-3">
          {atual.subcategorias.map((s) => (
            <li key={s.id}>
              <Link
                href={`/c/${atual.id}?sub=${s.id}`}
                onClick={aoFechar}
                className="flex min-h-toque items-center gap-2 rounded-[12px] px-3 text-sm text-grafite hover:bg-linho hover:text-marinho"
              >
                <Icone nome="chevR" tamanho="sm" className="text-azul" />
                {s.nome}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2 border-t border-solid border-borda pt-4">
          <Link href="/ofertas" onClick={aoFechar} className="chip min-h-toque">
            <Icone nome="tag" tamanho="sm" />
            Ofertas de todas as lojas
          </Link>
          <Link href="/lojas" onClick={aoFechar} className="chip min-h-toque">
            <Icone nome="store" tamanho="sm" />
            Lojas da cidade
          </Link>
        </div>
      </div>
    </div>
  );
}
