import Link from 'next/link';
import type { CriativoAnuncio } from '@/types/domain';
import { FaixaAnuncio } from './FaixaAnuncio';
import { FotoCriativo } from './FotoCriativo';
import { MarcaAnunciante } from './MarcaAnunciante';

/**
 * Vaga K1 (topo da categoria). Sem anunciante no período, o espaço vira um
 * convite para o lojista anunciar — sem fingir que é anúncio de alguém.
 */
export function AnuncioTopoCategoria({
  anuncio,
  categoria,
}: {
  anuncio?: CriativoAnuncio;
  categoria: string;
}) {
  if (anuncio)
    return (
      <div className="mt-3">
        <FaixaAnuncio anuncio={anuncio} />
      </div>
    );
  return (
    <Link
      href="/painel/anuncios?vaga=K1"
      className="relative mt-3 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl border-[1.5px] border-dashed border-azul-borda bg-azul-nevoa px-[22px] pb-5 pt-[42px] text-marinho hover:text-marinho lg:min-h-[96px] lg:pr-[220px] lg:pt-5"
    >
      <span className="pill pill-ad absolute right-3 top-2.5">Espaço publicitário</span>
      <div className="flex flex-col gap-0.5">
        <b>Anuncie no topo de {categoria}</b>
        <span className="text-[13px] text-grafite-2">Vaga K1 disponível — veja formatos e valores</span>
      </div>
      <span className="btn btn-soft btn-sm lg:absolute lg:bottom-5 lg:right-[22px]">Ver vaga</span>
    </Link>
  );
}

/** Vaga L1 na coluna lateral (desktop). */
export function AnuncioLateral({ anuncio }: { anuncio: CriativoAnuncio }) {
  const pronta = anuncio.modo === 'pronta';
  return (
    <Link
      href={anuncio.href}
      data-anuncio={anuncio.vaga}
      className="stitch relative flex min-h-[420px] flex-col justify-end gap-2 overflow-hidden rounded-xl px-[22px] pb-[22px] pt-16 [--r:24px] hover:text-inherit"
      style={{ backgroundColor: anuncio.fundo, color: anuncio.texto }}
    >
      {anuncio.imagem && (
        <FotoCriativo
          src={anuncio.imagem}
          fundo={anuncio.fundo}
          efeito={anuncio.efeito}
          enquadramento={anuncio.enquadramento}
          vertical
          sizes="300px"
        />
      )}
      <MarcaAnunciante anuncio={anuncio} className="absolute left-3 top-3" />
      <h3 className={pronta ? 'sr-only' : 'relative text-2xl text-inherit'}>{anuncio.titulo}</h3>
      {!pronta && (
        <>
          <span className="relative opacity-85">{anuncio.sub}</span>
          <span className="btn relative self-start bg-branco" style={{ color: anuncio.fundo }}>
            {anuncio.cta}
          </span>
        </>
      )}
    </Link>
  );
}

/** Vaga L1 no celular: entra na grade depois do 6º produto, ocupando a linha toda. */
export function AnuncioNaGrade({ anuncio }: { anuncio: CriativoAnuncio }) {
  const pronta = anuncio.modo === 'pronta';
  return (
    <Link
      href={anuncio.href}
      data-anuncio={anuncio.vaga}
      className="stitch relative col-span-full flex min-h-[140px] flex-col justify-end gap-1 overflow-hidden rounded-xl px-5 pb-5 pt-16 [--r:24px] hover:text-inherit xl:hidden"
      style={{ backgroundColor: anuncio.fundo, color: anuncio.texto }}
    >
      {anuncio.imagem && (
        <FotoCriativo
          src={anuncio.imagem}
          fundo={anuncio.fundo}
          efeito={anuncio.efeito}
          enquadramento={anuncio.enquadramento}
          sizes="100vw"
        />
      )}
      <MarcaAnunciante anuncio={anuncio} className="absolute left-3 top-3" />
      <h3 className={pronta ? 'sr-only' : 'relative text-inherit'}>{anuncio.titulo}</h3>
      {!pronta && <span className="relative opacity-85">{anuncio.sub}</span>}
    </Link>
  );
}
