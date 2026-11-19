import type { Categoria, Loja, Produto } from '@/types/domain';

/** O que um cartão de produto precisa para se desenhar. */
export interface ItemVitrine {
  produto: Produto;
  loja: Loja;
  categoria: Categoria;
}

/** Junta produto + loja + categoria. Descarta produto cuja loja/categoria não veio (dado inconsistente). */
export function montarItens(produtos: Produto[], lojas: Loja[], categorias: Categoria[]): ItemVitrine[] {
  const lojaPorId = new Map(lojas.map((l) => [l.id, l]));
  const catPorId = new Map(categorias.map((c) => [c.id, c]));
  return produtos.flatMap((produto) => {
    const loja = lojaPorId.get(produto.lojaId);
    const categoria = catPorId.get(produto.categoriaId);
    return loja && categoria ? [{ produto, loja, categoria }] : [];
  });
}

/** Texto de entrega do cartão: "Chega hoje" para entregas no mesmo dia. */
export function textoChegada(prazo: string): string {
  return /^(Hoje|Em 2)/.test(prazo) ? 'Chega hoje' : `Chega ${prazo.toLowerCase()}`;
}

/** "Confecções Vale Azul" → "CV" (avatar da loja). */
export function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
