import Link from 'next/link';
import type { CriativoAnuncio } from '@/types/domain';
import { FotoCriativo } from './FotoCriativo';
import { MarcaAnunciante } from './MarcaAnunciante';

/** Vaga M2: dupla de destaques antes de "Lojas da cidade". */
export function DuplaAnuncios({ anuncios }: { anuncios: CriativoAnuncio[] }) {
  if (!anuncios.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {anuncios.map((a) => {
        const pronta = a.modo === 'pronta';
        return (
          <Link
            key={a.titulo}
            href={a.href}
            data-anuncio={a.vaga}
            className="stitch relative flex min-h-[160px] flex-col justify-center gap-1.5 overflow-hidden rounded-xl p-[22px] [--r:24px] hover:text-inherit"
            style={{ backgroundColor: a.fundo, color: a.texto }}
          >
            {a.imagem && (
              <FotoCriativo
                src={a.imagem}
                fundo={a.fundo}
                efeito={a.efeito}
                enquadramento={a.enquadramento}
                sizes="(max-width: 760px) 100vw, 620px"
              />
            )}
            <MarcaAnunciante
              anuncio={a}
              className={pronta ? 'absolute left-3 top-3' : 'relative self-start'}
            />
            <h3 className={pronta ? 'sr-only' : 'relative max-w-[320px] text-[22px] text-inherit'}>
              {a.titulo}
            </h3>
            {!pronta && (
              <>
                <span className="relative max-w-[320px] opacity-85">{a.sub}</span>
                <span className="relative mt-1.5 font-bold">{a.cta} →</span>
              </>
            )}
          </Link>
        );
      })}
    </div>
  );
}
