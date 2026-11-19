'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { CriativoAnuncio } from '@/types/domain';

/**
 * Vaga H1: carrossel patrocinado do topo da home (até 4 anunciantes em rotação).
 * Todo slide mostra "Patrocinado · anunciante" (CLAUDE.md §6 e §9.1).
 * Cores do slide são do criativo (dado), aplicadas via style.
 */
export function HeroAnuncios({ anuncios }: { anuncios: CriativoAnuncio[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  if (!anuncios.length) return null;

  const aoRolar = () => {
    const el = trilho.current;
    if (el) setAtivo(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="relative mt-3.5">
      <div
        ref={trilho}
        onScroll={aoRolar}
        aria-roledescription="carrossel"
        aria-label="Destaques patrocinados"
        className="sem-barra grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto rounded-xl"
      >
        {anuncios.map((a) => (
          <Link
            key={a.titulo}
            href={a.href}
            data-anuncio={a.vaga}
            className="relative flex min-h-[220px] snap-start flex-col justify-center gap-2.5 overflow-hidden px-[22px] py-[26px] lg:min-h-[320px] lg:px-14 lg:py-10"
            style={{ backgroundColor: a.fundo, color: a.texto }}
          >
            <span
              className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full opacity-[.14]"
              style={{ backgroundColor: a.destaque ?? a.texto }}
            />
            <span className="absolute -top-[60px] right-[70px] h-40 w-40 rounded-full border-2 border-dashed border-current opacity-25" />
            <span className="pill pill-ad self-start">Patrocinado · {a.anunciante}</span>
            <h2 className="max-w-[520px] text-[26px] leading-[1.1] text-inherit lg:text-[40px]">
              {a.titulo}
            </h2>
            <p className="m-0 max-w-[460px] opacity-90">{a.sub}</p>
            <span className="btn self-start" style={{ backgroundColor: a.texto, color: a.fundo }}>
              {a.cta}
              <Icone nome="chevR" tamanho="sm" />
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5" aria-hidden>
        {anuncios.map((a, i) => (
          <span
            key={a.titulo}
            className={`h-2 rounded-full transition-all ${i === ativo ? 'w-[22px] bg-marinho' : 'w-2 bg-neutro-400'}`}
          />
        ))}
      </div>
    </div>
  );
}
