'use client';

import Link from 'next/link';
import { useCaminho } from '@/hooks/useCaminho';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { Categoria } from '@/types/domain';
import { MegaMenu } from './MegaMenu';

type Item = { href: string; rotulo: string };

const classeLink = (ativo: boolean) =>
  `whitespace-nowrap rounded-[8px] px-3 py-2.5 text-sm hover:bg-branco/[.08] hover:text-branco ${
    ativo ? 'bg-branco/[.08] text-branco' : 'text-sobre-marinho-forte'
  }`;

// useLayoutEffect no navegador (mede antes de pintar); no servidor vira useEffect.
const useMedida = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Barra de categorias do desktop. O que não couber na largura vai para o menu
 * "Mais" no fim da barra, em vez de ficar cortado (ajuste pedido em 18/11/2026).
 * A largura de cada item é medida numa cópia invisível da barra.
 */
export function BarraCategorias({ itens, categorias }: { itens: Item[]; categorias: Categoria[] }) {
  const path = useCaminho();
  const barra = useRef<HTMLDivElement>(null);
  const regua = useRef<HTMLDivElement>(null);
  const [cabem, setCabem] = useState(itens.length);
  const [aberto, setAberto] = useState(false);
  const [mega, setMega] = useState(false);
  const botaoMega = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  useMedida(() => {
    const calcular = () => {
      const b = barra.current;
      const r = regua.current;
      if (!b || !r) return;
      const filhos = [...r.children] as HTMLElement[]; // [Categorias, ...itens, Mais]
      const gap = 4;
      const larg = (el: HTMLElement | undefined) => (el ? el.getBoundingClientRect().width + gap : 0);
      const disponivel = b.clientWidth - larg(filhos[0]);
      const mais = larg(filhos[filhos.length - 1]);
      const larguras = filhos.slice(1, -1).map(larg);
      const total = larguras.reduce((a, w) => a + w, 0);
      if (total <= disponivel) return setCabem(itens.length);
      let soma = 0;
      let n = 0;
      for (const w of larguras) {
        if (soma + w + mais > disponivel) break;
        soma += w;
        n++;
      }
      setCabem(n);
    };
    calcular();
    const ro = new ResizeObserver(calcular);
    if (barra.current) ro.observe(barra.current);
    return () => ro.disconnect();
  }, [itens.length]);

  // Fecha o "Mais" ao clicar fora, com Esc ou ao trocar de página.
  useEffect(() => {
    setAberto(false);
    setMega(false);
  }, [path]);
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
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (!menu.current?.contains(alvo) && !lista.current?.contains(alvo)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', esc);
    };
  }, [aberto]);

  const visiveis = itens.slice(0, cabem);
  const sobra = itens.slice(cabem);

  const botaoCategorias = (
    <button
      ref={botaoMega}
      type="button"
      aria-expanded={mega}
      aria-controls="mega-menu"
      onClick={() => setMega((m) => !m)}
      className="inline-flex min-h-10 flex-none items-center gap-1.5 border-0 bg-transparent px-3 text-sm font-semibold text-branco"
    >
      <Icone nome="menu" tamanho="sm" />
      Categorias
      <Icone nome="chevD" tamanho="sm" className={mega ? 'rotate-180' : ''} />
    </button>
  );

  return (
    <nav aria-label="Categorias" className="hidden bg-marinho-2 lg:block">
      <div className="relative mx-auto max-w-container px-4">
        {/* Régua invisível: mede a largura real de cada item com a fonte carregada */}
        {/* Régua invisível: mede a largura real de cada item. O contêiner recorta, para a régua
            não alargar a página quando as categorias passam da largura da tela. */}
        <div
          aria-hidden
          className="pointer-events-none invisible absolute inset-x-0 top-0 h-0 overflow-hidden"
        >
          <div ref={regua} className="flex w-max gap-1 whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 px-3 text-sm font-semibold">
              <Icone nome="menu" tamanho="sm" />
              Categorias
              <Icone nome="chevD" tamanho="sm" />
            </span>
            {itens.map((i) => (
              <span key={i.href} className="px-3 py-2.5 text-sm">
                {i.rotulo}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 px-3 text-sm font-semibold">
              Mais
              <Icone nome="chevD" tamanho="sm" />
            </span>
          </div>
        </div>

        <div ref={barra} className="flex items-center gap-1 overflow-hidden">
          {botaoCategorias}
          {visiveis.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={path === i.href ? 'page' : undefined}
              className={classeLink(path === i.href)}
            >
              {i.rotulo}
            </Link>
          ))}
          {sobra.length > 0 && (
            <div ref={menu} className="ml-auto flex-none">
              <button
                type="button"
                aria-expanded={aberto}
                aria-controls="menu-mais"
                onClick={() => setAberto((a) => !a)}
                className="inline-flex min-h-10 items-center gap-1 rounded-[8px] border-0 bg-transparent px-3 text-sm font-semibold text-branco hover:bg-branco/[.08]"
              >
                Mais
                <Icone nome="chevD" tamanho="sm" className={aberto ? 'rotate-180' : ''} />
              </button>
            </div>
          )}
        </div>

        {mega && (
          <MegaMenu
            categorias={categorias}
            aoFechar={() => {
              setMega(false);
              botaoMega.current?.focus();
            }}
          />
        )}

        {aberto && sobra.length > 0 && (
          <div
            ref={lista}
            id="menu-mais"
            className="absolute right-4 top-full z-40 mt-1 flex min-w-[220px] flex-col gap-0.5 rounded-[14px] border border-solid border-borda bg-branco p-2 shadow-2"
          >
            {sobra.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                aria-current={path === i.href ? 'page' : undefined}
                className="flex min-h-toque items-center rounded-[10px] px-3 text-sm text-grafite hover:bg-linho hover:text-marinho"
              >
                {i.rotulo}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
