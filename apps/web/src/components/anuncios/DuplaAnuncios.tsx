import Link from 'next/link';
import type { CriativoAnuncio } from '@/types/domain';

/** Vaga M2: dupla de destaques antes de "Lojas da cidade". */
export function DuplaAnuncios({ anuncios }: { anuncios: CriativoAnuncio[] }) {
  if (!anuncios.length) return null;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {anuncios.map((a) => (
        <Link
          key={a.titulo}
          href={a.href}
          data-anuncio={a.vaga}
          className="stitch relative flex min-h-[140px] flex-col justify-center gap-1.5 overflow-hidden rounded-xl px-[22px] pb-[22px] pt-[42px] [--r:24px] hover:text-inherit"
          style={{ backgroundColor: a.fundo, color: a.texto }}
        >
          <span className="pill pill-ad absolute right-3 top-2.5">Patrocinado</span>
          <span className="text-[13px] opacity-80">{a.anunciante}</span>
          <h3 className="text-[22px] text-inherit">{a.titulo}</h3>
          <span className="opacity-85">{a.sub}</span>
          <span className="mt-1.5 font-bold">{a.cta} →</span>
        </Link>
      ))}
    </div>
  );
}
