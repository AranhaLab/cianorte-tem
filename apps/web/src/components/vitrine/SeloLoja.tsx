import type { Selo } from '@/types/domain';
import { Icone } from '@/components/ui/Icone';

/** Selos de loja (CLAUDE.md §5.3): Oficial (documentos) e Indicada (volume de pedidos). */
export function SeloLoja({ selo }: { selo: Selo }) {
  if (selo === 'oficial')
    return (
      <span className="pill pill-oficial">
        <Icone nome="shield" tamanho="sm" />
        Loja oficial
      </span>
    );
  if (selo === 'indicada')
    return (
      <span className="pill pill-indicada">
        <Icone nome="medal" tamanho="sm" />
        Indicada
      </span>
    );
  return null;
}
