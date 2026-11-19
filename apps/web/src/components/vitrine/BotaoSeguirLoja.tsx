'use client';

import { Icone } from '@/components/ui/Icone';
import { useComprador } from '@/stores/comprador';

/** "Seguir loja" — por enquanto só confirma (no back-end: inscrição em novidades da loja). */
export function BotaoSeguirLoja() {
  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={() => useComprador.getState().avisar('Você vai receber as novidades desta loja.')}
    >
      <Icone nome="heart" tamanho="sm" />
      Seguir loja
    </button>
  );
}
