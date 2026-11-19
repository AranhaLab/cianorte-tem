import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import type { CriativoAnuncio } from '@/types/domain';
import { FotoCriativo } from './FotoCriativo';
import { MarcaAnunciante } from './MarcaAnunciante';

/**
 * Vagas M1 (faixa entre seções) e K1 (topo da categoria). No máximo um bloco de anúncio
 * entre duas seções (CLAUDE.md §9.1). Arte pronta: o texto já está na imagem, e o
 * título vira texto para leitores de tela.
 */
export function FaixaAnuncio({ anuncio }: { anuncio: CriativoAnuncio | undefined }) {
  if (!anuncio) return null;
  const pronta = anuncio.modo === 'pronta';
  return (
    <Link
      href={anuncio.href}
      data-anuncio={anuncio.vaga}
      className="stitch relative flex min-h-[120px] flex-wrap items-center justify-between gap-3 overflow-hidden rounded-xl px-[22px] py-4 [--r:24px] hover:text-inherit lg:pr-[220px]"
      style={{ backgroundColor: anuncio.fundo, color: anuncio.texto }}
    >
      {anuncio.imagem && (
        <FotoCriativo
          src={anuncio.imagem}
          fundo={anuncio.fundo}
          efeito={anuncio.efeito}
          enquadramento={anuncio.enquadramento}
          sizes="(max-width: 1240px) 100vw, 1240px"
        />
      )}
      <div className="relative flex max-w-[640px] flex-col gap-1.5 self-start lg:self-center">
        <MarcaAnunciante anuncio={anuncio} />
        <h3 className={pronta ? 'sr-only' : 'text-xl text-inherit'}>{anuncio.titulo}</h3>
        {!pronta && <span className="opacity-85">{anuncio.sub}</span>}
      </div>
      {!pronta && (
        <span className="btn btn-dark relative lg:absolute lg:bottom-5 lg:right-[22px]">
          {anuncio.cta}
          <Icone nome="chevR" tamanho="sm" />
        </span>
      )}
    </Link>
  );
}
