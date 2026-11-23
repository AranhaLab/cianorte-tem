'use client';

import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import type { Categoria } from '@/types/domain';
import { useCategorias } from '@/stores/categorias';

/** Grade de categorias (protótipo: .mega). Usada no modal e na página /categorias. */
export function GradeCategorias({
  categorias,
  contagem,
}: {
  categorias: Categoria[];
  contagem?: Record<string, number>;
}) {
  const categoriasAtuais = useCategorias(categorias);
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {categoriasAtuais.map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.id}`}
          className="flex min-h-toque items-center gap-2.5 rounded-[14px] bg-linho p-3 text-sm font-semibold text-grafite hover:text-marinho"
        >
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-branco text-marinho">
            <Icone nome={c.icone} />
          </span>
          <span className="flex flex-col">
            {c.nome}
            {contagem && (
              <span className="text-xs font-normal text-grafite-2">{contagem[c.id] ?? 0} produtos</span>
            )}
          </span>
        </Link>
      ))}
    </div>
  );
}
