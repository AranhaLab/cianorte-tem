'use client';

import { Marca } from '@/components/marca/Marca';
import { useTenant } from '@/components/providers/TenantProvider';

export function Carregando({ mensagem = 'Carregando...' }: { mensagem?: string }) {
  const { nome } = useTenant();
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-linho/85 p-6 backdrop-blur-sm"
    >
      <div className="flex min-w-[220px] flex-col items-center gap-5 rounded-xl border border-solid border-borda-fria bg-branco px-10 py-9 text-center shadow-2">
        <span className="carregando-marca"><Marca nome={nome} escura /></span>
        <span className="text-sm font-medium text-grafite-2">{mensagem}</span>
      </div>
    </div>
  );
}
