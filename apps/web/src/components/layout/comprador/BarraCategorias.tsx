// @refresh reset
'use client';

import { useEffect, useRef, useState } from 'react';
import { LetreiroOfertas, type ItemInformativo } from '@/components/anuncios/LetreiroOfertas';
import { Icone } from '@/components/ui/Icone';
import { useCaminho } from '@/hooks/useCaminho';
import type { Categoria, CriativoAnuncio } from '@/types/domain';
import { MegaMenu } from './MegaMenu';
import { useCategorias } from '@/stores/categorias';

/**
 * Barra abaixo do cabeçalho.
 * - "Categorias" abre o mega menu (desktop) — mantido como estava.
 * - [DECIDIDO 19/11/2026] No lugar da lista de categorias e do "Mais" (repetiam os
 *   atalhos da home), um letreiro de ofertas: frases patrocinadas das lojas (vaga T1)
 *   intercaladas com avisos da cidade.
 */
type PropsBarraCategorias = {
  categorias: Categoria[];
  letreiro: CriativoAnuncio[];
  informativos: ItemInformativo[];
};

// A casca não possui hooks: ao trocar o código durante o desenvolvimento, a barra interna
// é montada com uma sequência nova de hooks, em vez de reutilizar o estado anterior.
export function BarraCategorias(props: PropsBarraCategorias) {
  return <ConteudoBarraCategorias {...props} />;
}

function ConteudoBarraCategorias({ categorias, letreiro, informativos }: PropsBarraCategorias) {
  const categoriasAtuais = useCategorias(categorias);
  const path = useCaminho();
  const [mega, setMega] = useState(false);
  const botaoMega = useRef<HTMLButtonElement>(null);

  useEffect(() => setMega(false), [path]);
  // Fecha o mega menu ao clicar fora dele.
  useEffect(() => {
    if (!mega) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!document.getElementById('mega-menu')?.contains(alvo) && !botaoMega.current?.contains(alvo))
        setMega(false);
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [mega]);

  return (
    <nav aria-label="Categorias e ofertas" className="bg-marinho-2">
      <div className="relative mx-auto flex min-h-10 max-w-container items-center gap-2 px-4">
        <button
          ref={botaoMega}
          type="button"
          aria-expanded={mega}
          aria-controls="mega-menu"
          onClick={() => setMega((m) => !m)}
          className="hidden min-h-10 flex-none items-center gap-1.5 border-0 bg-transparent px-3 text-sm font-semibold text-branco lg:inline-flex"
        >
          <Icone nome="menu" tamanho="sm" />
          Categorias
          <Icone nome="chevD" tamanho="sm" className={mega ? 'rotate-180' : ''} />
        </button>
        <span aria-hidden className="hidden h-5 w-px flex-none bg-branco/15 lg:block" />
        <LetreiroOfertas anuncios={letreiro} informativos={informativos} />

        {mega && (
          <MegaMenu
            categorias={categoriasAtuais}
            aoFechar={() => {
              setMega(false);
              botaoMega.current?.focus();
            }}
          />
        )}
      </div>
    </nav>
  );
}
