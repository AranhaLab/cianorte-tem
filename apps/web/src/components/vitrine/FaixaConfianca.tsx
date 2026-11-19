import type { ReactNode } from 'react';
import { Icone, type NomeIcone } from '@/components/ui/Icone';

export function FaixaConfianca({
  itens,
}: {
  itens: Array<{ icone: NomeIcone; titulo: string; texto: ReactNode }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {itens.map((i) => (
        <div
          key={i.titulo}
          className="flex items-start gap-2.5 rounded-[16px] border border-solid border-borda bg-branco p-3.5 text-[13px] text-grafite-2"
        >
          <Icone nome={i.icone} tamanho="lg" />
          <span>
            <b className="block text-sm text-marinho">{i.titulo}</b>
            {i.texto}
          </span>
        </div>
      ))}
    </div>
  );
}
