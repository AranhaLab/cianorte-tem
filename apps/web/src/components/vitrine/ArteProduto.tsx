import type { ReactNode } from 'react';
import type { Categoria } from '@/types/domain';
import { Icone } from '@/components/ui/Icone';

/**
 * Mídia do produto. Enquanto não há fotos reais, desenha o ícone da categoria
 * sobre o tom dela (como no protótipo). Proporção: moda 4:5, demais 1:1 (CLAUDE.md §3).
 * Quando houver fotos: trocar o ícone por <Image> mantendo o mesmo contêiner.
 */
export function ArteProduto({
  categoria,
  className = '',
  tamanhoIcone = 'w-[44%] h-[44%]',
  children,
}: {
  categoria: Categoria;
  className?: string;
  tamanhoIcone?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${
        categoria.proporcaoMidia === '4:5' ? 'aspect-[4/5]' : 'aspect-square'
      } ${className}`}
      style={{ backgroundColor: categoria.tom }}
    >
      <span className={`flex items-center justify-center text-marinho opacity-55 ${tamanhoIcone}`}>
        <Icone nome={categoria.icone} strokeWidth={1.2} className="!h-full !w-full" />
      </span>
      {children}
    </div>
  );
}
