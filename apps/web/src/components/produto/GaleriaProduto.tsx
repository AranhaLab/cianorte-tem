'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';
import { ArteProduto, capaDe } from '@/components/vitrine/ArteProduto';
import { MAX_MIDIAS } from '@/lib/regras/kits';
import type { Categoria, Midia } from '@/types/domain';

/**
 * Galeria do produto (CLAUDE.md §3 e §16): fotos e vídeo na ordem definida pelo
 * lojista, até 20 mídias. Fotos em 4:5 (moda) ou 1:1; vídeo sempre em quadro 9:16.
 * Desliza no celular, tem setas e teclado (← →) no desktop e miniaturas clicáveis.
 * Na demonstração as fotos são ilustrativas (Unsplash) e o vídeo é simulado sobre a 1ª foto.
 */
export function GaleriaProduto({
  midias: todas,
  categoria,
  selos,
}: {
  midias: Midia[];
  categoria: Categoria;
  selos?: ReactNode;
}) {
  const midias = todas.slice(0, MAX_MIDIAS);
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);

  const irPara = (i: number) => {
    const n = Math.max(0, Math.min(midias.length - 1, i));
    const el = trilho.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
    setAtual(n);
  };
  const teclado = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') irPara(atual + 1);
    if (e.key === 'ArrowLeft') irPara(atual - 1);
  };
  const proporcao = categoria.proporcaoMidia === '4:5' ? 'aspect-[4/5] max-h-[640px]' : 'aspect-square';

  return (
    <div className="flex flex-col gap-2.5">
      <div className={`relative overflow-hidden rounded-xl ${proporcao}`}>
        <div
          ref={trilho}
          tabIndex={0}
          role="region"
          aria-roledescription="galeria"
          aria-label={`Galeria do produto, ${midias.length} mídias. Use as setas do teclado.`}
          onKeyDown={teclado}
          onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="sem-barra grid h-full snap-x snap-mandatory auto-cols-[100%] grid-flow-col overflow-x-auto"
        >
          {midias.map((m, i) => (
            <div
              key={m.id}
              className="h-full snap-start"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${midias.length}: ${m.legenda}`}
            >
              {m.tipo === 'video' ? (
                <VideoDemo categoria={categoria} legenda={m.legenda} quadro={capaDe(midias)} />
              ) : (
                <ArteProduto
                  categoria={categoria}
                  variante={m.variante}
                  className="!aspect-auto h-full w-full"
                  tamanhoIcone="h-[40%] w-[40%]"
                  src={m.url}
                  alt={m.legenda}
                  sizes="(max-width: 900px) 100vw, 640px"
                  prioridade={i === 0}
                />
              )}
            </div>
          ))}
        </div>
        {selos && <div className="pointer-events-none absolute left-3.5 top-3.5 flex gap-1.5">{selos}</div>}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-marinho/70 px-2.5 py-1 text-xs font-semibold text-branco">
          {atual + 1}/{midias.length}
        </span>
        {midias.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Mídia anterior"
              disabled={atual === 0}
              onClick={() => irPara(atual - 1)}
              className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-branco/90 text-marinho shadow-1 disabled:opacity-0 lg:flex"
            >
              <Icone nome="chevL" />
            </button>
            <button
              type="button"
              aria-label="Próxima mídia"
              disabled={atual === midias.length - 1}
              onClick={() => irPara(atual + 1)}
              className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-branco/90 text-marinho shadow-1 disabled:opacity-0 lg:flex"
            >
              <Icone nome="chevR" />
            </button>
          </>
        )}
      </div>

      {midias.length > 1 && (
        <div className="sem-barra flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Miniaturas">
          {midias.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => irPara(i)}
              aria-label={
                m.tipo === 'video'
                  ? `Vídeo (${i + 1} de ${midias.length})`
                  : `Foto ${i + 1} de ${midias.length}`
              }
              aria-current={i === atual ? 'true' : undefined}
              className={`relative h-16 w-16 flex-none overflow-hidden rounded-[12px] border-2 border-solid p-0 ${
                i === atual ? 'border-azul' : 'border-transparent'
              }`}
            >
              {m.tipo === 'video' ? (
                <span className="flex h-full w-full items-center justify-center bg-marinho text-branco">
                  <Icone nome="play" />
                </span>
              ) : (
                <ArteProduto
                  categoria={categoria}
                  variante={m.variante}
                  className="!aspect-auto h-full w-full"
                  tamanhoIcone="h-1/2 w-1/2"
                  src={m.url}
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}
      <p className="m-0 text-xs text-grafite-2">
        Fotos em {categoria.proporcaoMidia === '4:5' ? '4:5 (moda)' : '1:1'} · vídeo em 9:16 · até{' '}
        {MAX_MIDIAS} mídias na ordem escolhida pela loja.
      </p>
    </div>
  );
}

/** Vídeo de demonstração: quadro 9:16 centralizado, sem arquivo real (sem autoplay com som). */
function VideoDemo({
  categoria,
  legenda,
  quadro,
}: {
  categoria: Categoria;
  legenda: string;
  /** Quadro de capa do vídeo (na demo, a 1ª foto do produto). */
  quadro?: string;
}) {
  const [tocando, setTocando] = useState(false);
  return (
    <div className="flex h-full w-full items-center justify-center bg-marinho">
      <div className="relative flex aspect-[9/16] h-full max-w-full items-center justify-center overflow-hidden">
        <ArteProduto
          categoria={categoria}
          variante={1}
          className={`absolute inset-0 !aspect-auto h-full w-full ${tocando ? 'motion-safe:animate-pulse' : ''}`}
          tamanhoIcone="h-[45%] w-[45%]"
          src={quadro}
          sizes="(max-width: 900px) 60vw, 360px"
        />
        <span className="pill pill-ad absolute left-2.5 top-2.5">Vídeo 9:16</span>
        <button
          type="button"
          onClick={() => setTocando((t) => !t)}
          aria-label={tocando ? `Pausar ${legenda}` : `Reproduzir ${legenda}`}
          aria-pressed={tocando}
          className="relative flex h-16 w-16 items-center justify-center rounded-full border-0 bg-marinho/80 text-branco shadow-2"
        >
          <Icone nome={tocando ? 'pause' : 'play'} tamanho="lg" />
        </button>
        {tocando && (
          <span className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-branco/30">
            <i className="block h-full w-1/2 bg-branco motion-safe:animate-[progresso_6s_linear_infinite]" />
          </span>
        )}
      </div>
    </div>
  );
}
