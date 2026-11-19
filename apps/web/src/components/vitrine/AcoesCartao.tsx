'use client';

import { useRouter } from 'next/navigation';
import { Icone } from '@/components/ui/Icone';
import { useComprador } from '@/stores/comprador';

/**
 * Favoritar e "+" (adicionar rápido) do cartão. A área clicável tem 44 px
 * (acessibilidade) e o círculo visível tem 36 px, como no protótipo.
 * Produto com variação leva à página do produto para escolher a opção (CLAUDE.md §14).
 */
export function AcoesCartao({
  produtoId,
  nome,
  temVariacao,
  nomeVariacao,
  esgotado,
}: {
  produtoId: string;
  nome: string;
  temVariacao: boolean;
  nomeVariacao?: string;
  esgotado: boolean;
}) {
  const router = useRouter();
  const favorito = useComprador((s) => s.hidratado && s.favoritos.includes(produtoId));
  const { alternarFavorito, adicionar, avisar } = useComprador.getState();

  const adicionarRapido = () => {
    if (temVariacao) {
      router.push(`/p/${produtoId}`);
      avisar(`Escolha ${nomeVariacao?.toLowerCase() ?? 'uma opção'} para adicionar.`);
      return;
    }
    adicionar(produtoId, null, 1, nome);
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          avisar(alternarFavorito(produtoId) ? 'Salvo nos favoritos.' : 'Removido dos favoritos.')
        }
        aria-pressed={favorito}
        aria-label={favorito ? `Remover ${nome} dos favoritos` : `Favoritar ${nome}`}
        className="absolute right-2.5 top-2.5 flex h-11 w-11 items-center justify-center border-0 bg-transparent p-0"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-branco/90 text-marinho">
          <Icone nome="heart" className={favorito ? 'fill-acento text-acento' : ''} />
        </span>
      </button>
      {!esgotado && (
        <button
          type="button"
          onClick={adicionarRapido}
          aria-label={`Adicionar ${nome} à sacola`}
          className="absolute right-2.5 top-[52px] flex h-11 w-11 items-center justify-center border-0 bg-transparent p-0"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-azul text-branco shadow-1 transition-colors hover:bg-marinho">
            <Icone nome="plus" />
          </span>
        </button>
      )}
    </>
  );
}
