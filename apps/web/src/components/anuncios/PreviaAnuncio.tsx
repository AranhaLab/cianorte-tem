'use client';

import type { CriativoAnuncio } from '@/types/domain';
import { AnuncioLateral } from './AnunciosCategoria';
import { DuplaAnuncios } from './DuplaAnuncios';
import { FaixaAnuncio } from './FaixaAnuncio';
import { HeroAnuncios } from './HeroAnuncios';

/**
 * Prévia fiel: desenha o criativo com o MESMO componente da vitrine, na vaga dele.
 * `inert`: a prévia não navega nem recebe foco (é só para ver).
 */
export function PreviaAnuncio({ criativo }: { criativo: CriativoAnuncio }) {
  const vaga = criativo.vaga;
  return (
    <div inert className="pointer-events-none select-none">
      {vaga === 'H1' && <HeroAnuncios anuncios={[criativo]} />}
      {(vaga === 'M1' || vaga === 'K1') && <FaixaAnuncio anuncio={criativo} />}
      {vaga === 'M2' && (
        <div className="max-w-[620px]">
          <DuplaAnuncios anuncios={[criativo]} />
        </div>
      )}
      {vaga === 'L1' && (
        <div className="w-[300px] max-w-full">
          <AnuncioLateral anuncio={criativo} />
        </div>
      )}
    </div>
  );
}
