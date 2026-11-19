import { Icone } from '@/components/ui/Icone';
import { reais } from '@/lib/regras/dinheiro';
import { progressoFreteGratis } from '@/lib/regras/frete';
import type { Loja } from '@/types/domain';

/** "Faltam R$ X para frete grátis nesta loja" com barra de progresso (CLAUDE.md §16). */
export function BarraFreteGratis({ loja, subtotal }: { loja: Loja; subtotal: number }) {
  const p = progressoFreteGratis(loja, subtotal);
  if (!p) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1 text-[13px]">
        {p.atingido ? (
          <>
            <Icone nome="check" tamanho="sm" />
            <b>Frete grátis nesta loja</b>
          </>
        ) : (
          <span>
            Faltam <b>{reais(p.falta)}</b> para frete grátis nesta loja
          </span>
        )}
      </span>
      <span
        className="block h-1.5 w-full overflow-hidden rounded-full bg-neutro-300"
        role="progressbar"
        aria-valuenow={p.pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso para frete grátis"
      >
        <i className="block h-full bg-verde" style={{ width: `${p.pct}%` }} />
      </span>
    </div>
  );
}
