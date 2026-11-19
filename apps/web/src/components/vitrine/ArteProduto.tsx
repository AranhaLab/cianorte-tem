import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Categoria, Midia } from '@/types/domain';
import { Icone } from '@/components/ui/Icone';

/** Enquadramentos diferentes para as fotos de exemplo (frente, detalhe, lado…). */
const ENQUADRAMENTOS = [
  'scale-100 rotate-0',
  'scale-[1.45] -rotate-6',
  'scale-75 rotate-3',
  'scale-[1.2] translate-x-[18%] rotate-0',
  'scale-90 -translate-y-[10%] rotate-12',
  'scale-[1.6] -translate-x-[12%] -rotate-3',
];

/**
 * Mídia do produto. Enquanto não há fotos reais, desenha o ícone da categoria
 * sobre o tom dela (como no protótipo); `variante` muda o enquadramento para a
 * galeria ter "fotos" diferentes. Proporção: moda 4:5, demais 1:1 (CLAUDE.md §3).
 * Com `src`, mostra a foto (next/image, otimizada) no mesmo contêiner.
 */
export function ArteProduto({
  categoria,
  className = '',
  tamanhoIcone = 'w-[44%] h-[44%]',
  variante = 0,
  esmaecido = false,
  src,
  alt = '',
  sizes = '(max-width: 640px) 50vw, 280px',
  prioridade = false,
  children,
}: {
  categoria: Categoria;
  className?: string;
  tamanhoIcone?: string;
  variante?: number;
  /** Produto indisponível: só o desenho fica apagado; selos continuam legíveis. */
  esmaecido?: boolean;
  /** Foto real. Sem ela, desenha o ícone da categoria. */
  src?: string;
  /** Texto alternativo. Vazio quando o nome do produto já está ao lado (evita leitura dobrada). */
  alt?: string;
  sizes?: string;
  prioridade?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${
        categoria.proporcaoMidia === '4:5' ? 'aspect-[4/5]' : 'aspect-square'
      } ${className}`}
      style={{ backgroundColor: categoria.tom }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={prioridade}
          className={`object-cover ${esmaecido ? 'opacity-40 grayscale' : ''}`}
        />
      ) : (
        <span
          className={`flex items-center justify-center text-marinho transition-transform ${esmaecido ? 'opacity-25 grayscale' : 'opacity-55'} ${tamanhoIcone} ${
            ENQUADRAMENTOS[variante % ENQUADRAMENTOS.length]
          }`}
        >
          <Icone nome={categoria.icone} strokeWidth={1.2} className="!h-full !w-full" />
        </span>
      )}
      {children}
    </div>
  );
}

/** Foto de capa: a 1ª imagem com arquivo (o vídeo não serve de miniatura). */
export const capaDe = (midias: Midia[]) => midias.find((m) => m.tipo === 'imagem' && m.url)?.url;
