import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import { desconto, reais } from '@/lib/regras/dinheiro';
import { textoChegada, type ItemVitrine } from '@/lib/vitrine';
import { ArteProduto } from './ArteProduto';
import { AcoesCartao } from './AcoesCartao';

/**
 * Cartão de produto (protótipo: pcard). Renderiza no servidor; só os botões
 * de favoritar e "adicionar rápido" são de cliente.
 * O comprador vê disponibilidade, nunca saldo (CLAUDE.md §5.3).
 */
export function CartaoProduto({ item, patrocinado = false }: { item: ItemVitrine; patrocinado?: boolean }) {
  const { produto: p, loja, categoria } = item;
  const off = desconto(p);
  const esgotado = p.disponibilidade === 'indisponivel';

  return (
    <div
      className={`group relative flex h-full flex-col gap-2 rounded-[18px] border border-solid border-borda bg-branco p-2 text-grafite transition-[box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:shadow-2`}
    >
      <Link href={`/p/${p.id}`} className="flex flex-1 flex-col gap-2 text-inherit hover:text-inherit">
        <ArteProduto
          categoria={categoria}
          className={`rounded-[12px] ${esgotado ? 'opacity-70 grayscale-[.8]' : ''}`}
        >
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {off > 0 && <span className="pill pill-sale">−{off}%</span>}
            {p.kit && <span className="pill pill-indicada">Kit</span>}
            {esgotado && <span className="pill pill-off">Indisponível</span>}
          </div>
          {patrocinado && <span className="pill pill-ad absolute bottom-2 left-2">Patrocinado</span>}
        </ArteProduto>

        <div className="flex flex-1 flex-col gap-[5px] px-1.5 pb-1.5 pt-0.5">
          <span className="line-clamp-2 min-h-[38px] text-sm font-medium leading-[1.35]">{p.nome}</span>
          <span className={`text-xs text-grafite-3 line-through ${p.precoDeCentavos ? '' : 'invisible'}`}>
            {p.precoDeCentavos ? reais(p.precoDeCentavos) : '.'}
          </span>
          <span className="font-titulo text-xl font-bold leading-[1.1] text-marinho">
            {reais(p.precoCentavos)}
            {off > 0 && <span className="ml-1 font-ui text-[13px] font-bold text-verde">{off}% OFF</span>}
          </span>
          <span className="text-xs font-semibold text-verde-texto">{textoChegada(loja.prazo)}</span>
          <span className="flex items-center gap-1 text-xs text-grafite-2">
            <Icone nome="store" tamanho="sm" />
            {loja.nome}
          </span>
        </div>
      </Link>
      <AcoesCartao
        produtoId={p.id}
        nome={p.nome}
        temVariacao={!!p.variacao}
        nomeVariacao={p.variacao?.nome}
        esgotado={esgotado}
      />
    </div>
  );
}
