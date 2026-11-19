'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { freteFinal } from '@/lib/regras/frete';
import { precoKitAberto } from '@/lib/regras/kits';
import { useTenant } from '@/components/providers/TenantProvider';
import { useComprador } from '@/stores/comprador';
import type { Categoria, ItemSacola, Loja, Produto } from '@/types/domain';

export interface LinhaSacola {
  item: ItemSacola;
  produto: Produto;
  categoria: Categoria;
  /** Preço de uma unidade da linha (kit aberto: soma dos escolhidos com desconto). */
  precoUnitario: number;
  /** Kit: o que vem dentro, para mostrar na sacola e no checkout. */
  itensDoKit: Array<{ nome: string; quantidade: number }>;
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

  // Inclui os componentes de kits abertos para calcular o preço da composição.
  const ids = [
    ...new Set(itens.flatMap((i) => [i.produtoId, ...(i.composicao ?? []).map((c) => c.produtoId)])),
  ]
    .sort()
    .join(',');
  useEffect(() => {
    let vivo = true;
    Promise.all([
      api.produtos.porIds(tenant.slug, ids ? ids.split(',') : []).then(async (ps) => {
        // Kits fechados: busca também os componentes para listar o conteúdo.
        const extras = ps
          .flatMap((p) => p.kit?.componentes.map((c) => c.produtoId) ?? [])
          .filter((id) => !ps.some((p) => p.id === id));
        return extras.length ? [...ps, ...(await api.produtos.porIds(tenant.slug, extras))] : ps;
      }),
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
      const porId = (id: string) => dados.produtos.find((p) => p.id === id);
      const comps = item.composicao ?? (produto.kit?.tipo === 'fechado' ? produto.kit.componentes : []);
      const itensDoKit = comps.flatMap((c) => {
        const x = porId(c.produtoId);
        return x ? [{ nome: x.nome, quantidade: c.quantidade }] : [];
      });
      const precoUnitario =
        produto.kit?.tipo === 'aberto' && item.composicao
          ? precoKitAberto(
              item.composicao.map((c) => ({
                precoCentavos: porId(c.produtoId)?.precoCentavos ?? 0,
                quantidade: c.quantidade,
              })),
              produto.kit.descontoPercentual,
            )
          : produto.precoCentavos;
      g.linhas.push({ item, produto, categoria, precoUnitario, itensDoKit });
      g.subtotal += precoUnitario * item.quantidade;
      grupos.set(loja.id, g);
    }
    const lista = [...grupos.values()].map((g) => ({ ...g, frete: freteFinal(g.loja, g.subtotal) }));
    return { carregando: false, grupos: lista, subtotal: lista.reduce((a, g) => a + g.subtotal, 0) };
  }, [dados, itens]);
}
