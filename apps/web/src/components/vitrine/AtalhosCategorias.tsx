'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { Categoria } from '@/types/domain';

/**
 * Atalhos de categoria da home em carrossel: sempre UMA fileira (antes, no desktop,
 * sobrava uma categoria sozinha na segunda linha). Desliza no toque; no computador,
 * setas aparecem só quando há mais categorias do que cabem.
 */
export function AtalhosCategorias({ categorias }: { categorias: Categoria[] }) {
  const trilho = useRef<HTMLUListElement>(null);
  const [limites, setLimites] = useState({ inicio: true, fim: true });

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () =>
      setLimites({ inicio: el.scrollLeft <= 4, fim: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, []);

  const rolar = (dir: -1 | 1) =>
    trilho.current?.scrollBy({ left: dir * trilho.current.clientWidth * 0.8, behavior: 'smooth' });

  const seta = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => rolar(dir)}
      aria-label={dir < 0 ? 'Categorias anteriores' : 'Mais categorias'}
      className={`absolute top-[22px] z-[2] hidden h-11 w-11 items-center justify-center rounded-full border border-solid border-borda bg-branco text-marinho shadow-1 lg:inline-flex ${
        dir < 0 ? '-left-3' : '-right-3'
      }`}
    >
      <Icone nome={dir < 0 ? 'chevL' : 'chevR'} />
    </button>
  );

  return (
    <section className="relative my-[26px]" aria-label="Categorias">
      {!limites.inicio && seta(-1)}
      <ul
        ref={trilho}
        className="sem-barra m-0 grid snap-x auto-cols-[92px] grid-flow-col gap-2.5 overflow-x-auto scroll-smooth p-0 pb-2 pt-1 lg:auto-cols-[104px]"
      >
        {categorias.map((c) => (
          <li key={c.id} className="snap-start list-none">
            <Link
              href={`/c/${c.id}`}
              className="group flex flex-col items-center gap-2 text-center text-xs font-semibold leading-[1.25] text-grafite hover:text-grafite"
            >
              <span className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-solid border-borda bg-branco text-marinho transition-colors after:absolute after:inset-1 after:rounded-[16px] after:border after:border-dashed after:border-azul-borda after:content-[''] group-hover:border-azul group-hover:text-azul">
                <Icone nome={c.icone} tamanho="lg" />
              </span>
              {c.nome}
            </Link>
          </li>
        ))}
      </ul>
      {!limites.fim && seta(1)}
    </section>
  );
}
