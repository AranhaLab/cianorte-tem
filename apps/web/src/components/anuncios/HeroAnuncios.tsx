'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { CriativoAnuncio } from '@/types/domain';
import { FotoCriativo } from './FotoCriativo';
import { MarcaAnunciante } from './MarcaAnunciante';

/**
 * Vaga H1: carrossel patrocinado do topo da home (até 4 anunciantes em rotação).
 * Todo slide mostra o selo "Patrocinado" com logo e nome da loja (CLAUDE.md §6 e §9.1).
 * Cores do slide são do criativo (dado), aplicadas via style.
 */
export function HeroAnuncios({ anuncios }: { anuncios: CriativoAnuncio[] }) {
  const trilho = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [rotacao, setRotacao] = useState(true);
  useEffect(() => {
    if (
      anuncios.length < 2 ||
      pausado ||
      !rotacao ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    const timer = window.setInterval(() => {
      const el = trilho.current;
      if (!el || document.hidden) return;
      const proximo = (Math.round(el.scrollLeft / el.clientWidth) + 1) % anuncios.length;
      el.scrollTo({ left: proximo * el.clientWidth, behavior: 'smooth' });
    }, 6000);
    return () => window.clearInterval(timer);
  }, [anuncios.length, pausado, rotacao]);
  if (!anuncios.length) return null;

  const aoRolar = () => {
    const el = trilho.current;
    if (el) setAtivo(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div
      className="relative mt-3.5"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPausado(false);
      }}
    >
      <div
        ref={trilho}
        onScroll={aoRolar}
        aria-roledescription="carrossel"
        aria-label="Destaques patrocinados"
        className="sem-barra grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto rounded-xl"
      >
        {anuncios.map((a, i) => (
          <Link
            key={a.titulo}
            href={a.href}
            data-anuncio={a.vaga}
            className="relative flex min-h-[220px] snap-start flex-col justify-center gap-2.5 overflow-hidden px-[22px] py-[26px] lg:min-h-[320px] lg:px-14 lg:py-10"
            style={{ backgroundColor: a.fundo, color: a.texto }}
          >
            {a.imagem ? (
              <FotoCriativo
                src={a.imagem}
                fundo={a.fundo}
                efeito={a.efeito}
                enquadramento={a.enquadramento}
                sizes="(max-width: 1240px) 100vw, 1240px"
                prioridade={i === 0}
              />
            ) : (
              <>
                <span
                  className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full opacity-[.14]"
                  style={{ backgroundColor: a.destaque ?? a.texto }}
                />
                <span className="absolute -top-[60px] right-[70px] h-40 w-40 rounded-full border-2 border-dashed border-current opacity-25" />
              </>
            )}
            <MarcaAnunciante
              anuncio={a}
              className={a.modo === 'pronta' ? 'absolute left-4 top-4' : 'relative self-start'}
            />
            <h2
              className={
                a.modo === 'pronta'
                  ? 'sr-only'
                  : 'relative max-w-[520px] text-[26px] leading-[1.1] text-inherit lg:text-[40px]'
              }
            >
              {a.titulo}
            </h2>
            {a.modo !== 'pronta' && (
              <>
                <p className="relative m-0 max-w-[460px] opacity-90">{a.sub}</p>
                <span
                  className="btn relative self-start"
                  style={{ backgroundColor: a.texto, color: a.fundo }}
                >
                  {a.cta}
                  <Icone nome="chevR" tamanho="sm" />
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
      {anuncios.length > 1 &&
        ([-1, 1] as const).map((direcao) => (
          <button
            key={direcao}
            type="button"
            aria-label={direcao < 0 ? 'Anúncio anterior' : 'Próximo anúncio'}
            onClick={() =>
              trilho.current?.scrollTo({
                left: ((ativo + direcao + anuncios.length) % anuncios.length) * trilho.current.clientWidth,
                behavior: 'smooth',
              })
            }
            className={`absolute top-1/2 z-[2] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-solid border-borda bg-branco text-marinho shadow-1 ${direcao < 0 ? 'left-2' : 'right-2'}`}
          >
            <Icone nome={direcao < 0 ? 'chevL' : 'chevR'} />
          </button>
        ))}
      <div className="mt-2.5 flex justify-center gap-1.5">
        {anuncios.map((a, i) => (
          <button
            type="button"
            key={a.titulo}
            aria-label={`Mostrar anúncio ${i + 1} de ${anuncios.length}: ${a.anunciante}`}
            aria-current={i === ativo ? 'true' : undefined}
            onClick={() =>
              trilho.current?.scrollTo({ left: i * trilho.current.clientWidth, behavior: 'smooth' })
            }
            className="flex h-11 w-11 items-center justify-center border-0 bg-transparent"
          >
            <span
              className={`h-2 rounded-full transition-all ${i === ativo ? 'w-[22px] bg-marinho' : 'w-2 bg-neutro-400'}`}
            />
          </button>
        ))}
        {anuncios.length > 1 && (
          <button
            type="button"
            className="btn btn-ghost btn-sm min-h-toque"
            onClick={() => setRotacao((atual) => !atual)}
          >
            {rotacao ? 'Pausar anúncios' : 'Continuar anúncios'}
          </button>
        )}
      </div>
    </div>
  );
}
