import type { ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';

/** Moldura dos textos jurídicos. Texto PROVISÓRIO até o jurídico aprovar (CLAUDE.md §6). */
export function TextoLegal({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <article className="mx-auto my-6 max-w-[820px]">
      <div className="flex flex-col gap-4 rounded-xl border border-solid border-borda bg-branco p-6 [&_h3]:scroll-mt-36 [&_p]:m-0 [&_p]:text-grafite-2">
        <h1>{titulo}</h1>
        <div className="banner-info bg-aviso-claro text-aviso-texto">
          <Icone nome="alert" />
          <span>
            Texto provisório do protótipo. A versão final deve ser redigida e aprovada pelo jurídico.
          </span>
        </div>
        {children}
      </div>
    </article>
  );
}
