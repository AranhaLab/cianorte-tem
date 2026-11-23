'use client';

import { Migalhas } from '@/components/ui/Basicos';
import { useCategorias } from '@/stores/categorias';
import type { Categoria } from '@/types/domain';

export function CategoriaNome({ categoria }: { categoria: Categoria }) {
  const atuais = useCategorias([categoria]);
  return atuais.find((item) => item.id === categoria.id)?.nome ?? categoria.nome;
}

export function MigalhasProduto({ categoria, nome }: { categoria: Categoria; nome: string }) {
  const atuais = useCategorias([categoria]);
  const atual = atuais.find((item) => item.id === categoria.id) ?? categoria;
  return (
    <Migalhas
      itens={[
        { rotulo: 'Início', href: '/' },
        { rotulo: atual.nome, href: `/c/${atual.id}` },
        { rotulo: nome },
      ]}
    />
  );
}
