import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import type { CriativoAnuncio } from '@/types/domain';

/** Vaga M1: faixa entre seções. No máximo um bloco de anúncio entre duas seções (CLAUDE.md §9.1). */
export function FaixaAnuncio({ anuncio }: { anuncio: CriativoAnuncio | undefined }) {
  if (!anuncio) return null;
  return (
    <Link
      href={anuncio.href}
      data-anuncio={anuncio.vaga}
      className="stitch relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl px-[22px] pb-5 pt-[42px] [--r:24px] hover:text-inherit lg:min-h-[96px] lg:pr-[220px] lg:pt-5"
      style={{ backgroundColor: anuncio.fundo, color: anuncio.texto }}
    >
      <span className="pill pill-ad absolute right-3 top-2.5">Patrocinado · {anuncio.anunciante}</span>
      <div className="flex max-w-[640px] flex-col gap-1">
        <h3 className="text-xl text-inherit">{anuncio.titulo}</h3>
        <span className="opacity-85">{anuncio.sub}</span>
      </div>
      <span className="btn btn-dark lg:absolute lg:bottom-5 lg:right-[22px]">
        {anuncio.cta}
        <Icone nome="chevR" tamanho="sm" />
      </span>
    </Link>
  );
}
