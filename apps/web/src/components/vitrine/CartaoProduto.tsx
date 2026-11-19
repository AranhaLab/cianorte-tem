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
        <ArteProduto categoria={categoria} className="rounded-[12px]" esmaecido={esgotado}>
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            {off > 0 && <span className="pill pill-sale">−{off}%</span>}
            {p.kit && (
              <span className="pill pill-indicada">{p.kit.tipo === 'aberto' ? 'Monte o seu' : 'Kit'}</span>
            )}
            {esgotado && <span className="pill pill-off">Indisponível</span>}
          </div>
          {patrocinado && <span className="pill pill-ad absolute bottom-2 left-2">Patrocinado</span>}
          {/* Vídeo como capa do cartão: na versão real, vídeo mudo em loop (sem autoplay com som) */}
          {p.midias[0]?.tipo === 'video' && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-marinho/25 to-transparent motion-safe:animate-pulse"
              />
              <span className="pill pill-ad absolute bottom-2 right-2">
                <Icone nome="play" tamanho="sm" />
                Vídeo
              </span>
            </>
          )}
        </ArteProduto>

        <div className="flex flex-1 flex-col gap-[5px] px-1.5 pb-1.5 pt-0.5">
          <span className="line-clamp-2 min-h-[38px] text-sm font-medium leading-[1.35]">{p.nome}</span>
          <span className={`text-xs text-grafite-3 line-through ${p.precoDeCentavos ? '' : 'invisible'}`}>
            {p.precoDeCentavos ? reais(p.precoDeCentavos) : '.'}
          </span>
          <span className="font-titulo text-xl font-bold leading-[1.1] text-marinho">
            {p.kit?.tipo === 'aberto' && (
              <span className="mr-1 font-ui text-xs font-semibold text-grafite-2">a partir de</span>
            )}
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
        temVariacao={!!p.variacao || p.kit?.tipo === 'aberto'}
        nomeVariacao={p.kit?.tipo === 'aberto' ? 'os itens do kit' : p.variacao?.nome}
        esgotado={esgotado}
      />
    </div>
  );
}
