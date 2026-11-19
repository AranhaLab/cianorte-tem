'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { freteFinal } from '@/lib/regras/frete';
import { useTenant } from '@/components/providers/TenantProvider';
import { useComprador } from '@/stores/comprador';
import type { Categoria, ItemSacola, Loja, Produto } from '@/types/domain';

export interface LinhaSacola {
  item: ItemSacola;
  produto: Produto;
  categoria: Categoria;
}
export interface GrupoLoja {
  loja: Loja;
  linhas: LinhaSacola[];
  subtotal: number;
  frete: number; // frete de entrega já considerando frete grátis da loja
}

/**
 * Sacola agrupada por loja (multiloja, CLAUDE.md §5.4).
 * No back-end real, GET /v1/sacola já devolve isto calculado e revalidado.
 */
export function useSacolaDetalhada() {
  const tenant = useTenant();
  const itens = useComprador((s) => s.itens);
  const [dados, setDados] = useState<{ produtos: Produto[]; lojas: Loja[]; categorias: Categoria[] } | null>(
    null,
  );

  const ids = itens.map((i) => i.produtoId).join(',');
  useEffect(() => {
    let vivo = true;
    Promise.all([
      api.produtos.porIds(tenant.slug, ids ? ids.split(',') : []),
      api.lojas.listar(tenant.slug),
      api.categorias.listar(tenant.slug),
    ]).then(([produtos, lojas, categorias]) => vivo && setDados({ produtos, lojas, categorias }));
    return () => {
      vivo = false;
    };
  }, [tenant.slug, ids]);

  return useMemo(() => {
    if (!dados) return { carregando: true, grupos: [] as GrupoLoja[], subtotal: 0 };
    const grupos = new Map<string, GrupoLoja>();
    for (const item of itens) {
      const produto = dados.produtos.find((p) => p.id === item.produtoId);
      const loja = produto && dados.lojas.find((l) => l.id === produto.lojaId);
      const categoria = produto && dados.categorias.find((c) => c.id === produto.categoriaId);
      if (!produto || !loja || !categoria) continue; // item que saiu do catálogo
      const g = grupos.get(loja.id) ?? { loja, linhas: [], subtotal: 0, frete: 0 };
      g.linhas.push({ item, produto, categoria });
      g.subtotal += produto.precoCentavos * item.quantidade;
      grupos.set(loja.id, g);
    }
    const lista = [...grupos.values()].map((g) => ({ ...g, frete: freteFinal(g.loja, g.subtotal) }));
    return { carregando: false, grupos: lista, subtotal: lista.reduce((a, g) => a + g.subtotal, 0) };
  }, [dados, itens]);
}
