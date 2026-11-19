'use client';

import { Children, useRef, type ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';

/**
 * Carrossel horizontal (protótipo: rail). Rola por toque/arraste; no desktop
 * (≥ 1000 px) ganha setas. Os itens chegam renderizados do servidor.
 */
export function Carrossel({
  rotulo,
  setas = true,
  children,
}: {
  rotulo: string;
  setas?: boolean;
  children: ReactNode;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const rolar = (dir: -1 | 1) =>
    trilho.current?.scrollBy({ left: dir * trilho.current.clientWidth * 0.9, behavior: 'smooth' });

  const seta = (dir: -1 | 1) => (
    <button
      type="button"
      onClick={() => rolar(dir)}
      aria-label={dir < 0 ? `Anteriores de ${rotulo}` : `Próximos de ${rotulo}`}
      className={`absolute top-[38%] z-[2] inline-flex h-11 w-11 items-center justify-center rounded-full border border-solid border-borda bg-branco text-marinho shadow-1 ${
        dir < 0 ? '-left-4' : '-right-4'
      }`}
    >
      <Icone nome={dir < 0 ? 'chevL' : 'chevR'} />
    </button>
  );

  return (
    <div className="relative">
      {setas && seta(-1)}
      <div
        ref={trilho}
        role="list"
        aria-label={rotulo}
        className="sem-barra grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto pb-1.5 sm:auto-cols-[30%] xl:auto-cols-[calc((100%-60px)/6)]"
      >
        {Children.map(children, (c) => (
          <div role="listitem" className="snap-start">
            {c}
          </div>
        ))}
      </div>
      {setas && seta(1)}
    </div>
  );
}
