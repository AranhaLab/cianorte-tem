import type { NomeIcone } from '@/components/ui/Icone';
import type { ItemVitrine } from '@/lib/vitrine';
import { CabecalhoSecao } from './CabecalhoSecao';
import { CartaoProduto } from './CartaoProduto';
import { Carrossel } from './Carrossel';

/**
 * Seção com título + carrossel de produtos (Mais vendidos, Melhores preços…).
 * `patrocinadoPrimeiro`: a 1ª posição é a vaga C1 (produto patrocinado).
 */
export function SecaoCarrossel({
  id,
  titulo,
  itens,
  kicker,
  icone,
  verTodos,
  patrocinadoPrimeiro = false,
}: {
  id: string;
  titulo: string;
  itens: ItemVitrine[];
  kicker?: string;
  icone?: NomeIcone;
  verTodos?: string;
  patrocinadoPrimeiro?: boolean;
}) {
  if (!itens.length) return null;
  return (
    <section className="my-[26px]" aria-labelledby={`h-${id}`}>
      <CabecalhoSecao id={id} titulo={titulo} kicker={kicker} icone={icone} verTodos={verTodos} />
      <Carrossel rotulo={titulo}>
        {itens.map((it, i) => (
          <CartaoProduto key={it.produto.id} item={it} patrocinado={patrocinadoPrimeiro && i === 0} />
        ))}
      </Carrossel>
    </section>
  );
}
