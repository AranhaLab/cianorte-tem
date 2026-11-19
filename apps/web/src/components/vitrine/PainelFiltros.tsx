'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icone } from '@/components/ui/Icone';
import type { Facetas, FiltrosLaterais } from '@/lib/api';
import { totalAtivos, urlFiltros } from '@/lib/filtros';
import { reais } from '@/lib/regras/dinheiro';

/**
 * Painel de filtros laterais (marca, loja, característica e faixa de preço).
 * Abre pela direita no desktop e de baixo no celular. Aplicar = navegar para a
 * URL com os filtros; o servidor filtra (CLAUDE.md §16).
 */
export function PainelFiltros({
  base,
  facetas,
  atuais,
  manter,
}: {
  base: string;
  facetas: Facetas;
  atuais: FiltrosLaterais;
  manter: { ord?: string; f?: string; q?: string };
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const painel = useRef<HTMLDivElement>(null);
  const n = totalAtivos(atuais);

  useEffect(() => {
    if (!aberto) return;
    painel.current?.querySelector<HTMLElement>('input, button')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [aberto]);

  const aplicar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = String(fd.get(k) ?? '')
        .replace(',', '.')
        .trim();
      return v === '' || !Number.isFinite(Number(v)) ? undefined : Math.round(Number(v) * 100);
    };
    setAberto(false);
    router.push(
      urlFiltros(base, {
        ...manter,
        sub: atuais.sub,
        marcas: fd.getAll('marca').map(String),
        lojas: fd.getAll('loja').map(String),
        caracteristicas: fd.getAll('car').map(String),
        precoMin: num('min'),
        precoMax: num('max'),
      }),
      { scroll: false },
    );
  };

  const grupo = (
    titulo: string,
    nome: string,
    itens: Array<{ valor: string; rotulo?: string; total: number }>,
    marcados: string[] = [],
  ) =>
    itens.length > 0 && (
      <fieldset className="m-0 flex flex-col gap-1 border-0 border-t border-solid border-borda p-0 pt-3">
        <legend className="float-left mb-1 w-full text-sm font-bold text-marinho">{titulo}</legend>
        {itens.map((i) => (
          <label key={i.valor} className="flex min-h-toque cursor-pointer items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name={nome}
              value={i.valor}
              defaultChecked={marcados.includes(i.valor)}
              className="h-5 w-5 flex-none accent-azul"
            />
            <span className="flex-1">{i.rotulo ?? i.valor}</span>
            <span className="text-xs text-grafite-2">{i.total}</span>
          </label>
        ))}
      </fieldset>
    );

  return (
    <>
      <button
        type="button"
        className={`chip min-h-toque ${n ? 'chip-on' : ''}`}
        onClick={() => setAberto(true)}
      >
        <Icone nome="filter" tamanho="sm" />
        Filtros{n ? ` (${n})` : ''}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-end bg-marinho/50 lg:items-stretch"
          onClick={(e) => e.target === e.currentTarget && setAberto(false)}
        >
          <div
            ref={painel}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros"
            className="flex max-h-[88vh] w-full flex-col rounded-t-[26px] bg-branco lg:h-full lg:max-h-none lg:w-[380px] lg:rounded-l-[26px] lg:rounded-r-none"
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-5">
              <h2>Filtros</h2>
              <button
                type="button"
                className="icon-btn text-marinho hover:bg-neutro-200"
                aria-label="Fechar filtros"
                onClick={() => setAberto(false)}
              >
                <Icone nome="x" />
              </button>
            </div>
            <form method="get" onSubmit={aplicar} className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4">
                <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
                  <legend className="float-left mb-1 w-full text-sm font-bold text-marinho">
                    Faixa de preço (R$)
                  </legend>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="campo">
                      <label htmlFor="f-min">Mínimo</label>
                      <input
                        id="f-min"
                        name="min"
                        inputMode="decimal"
                        className="input"
                        placeholder={String(Math.floor(facetas.preco.min / 100))}
                        defaultValue={atuais.precoMin !== undefined ? atuais.precoMin / 100 : ''}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="f-max">Máximo</label>
                      <input
                        id="f-max"
                        name="max"
                        inputMode="decimal"
                        className="input"
                        placeholder={String(Math.ceil(facetas.preco.max / 100))}
                        defaultValue={atuais.precoMax !== undefined ? atuais.precoMax / 100 : ''}
                      />
                    </div>
                  </div>
                  <span className="dica">
                    Nesta lista: de {reais(facetas.preco.min)} a {reais(facetas.preco.max)}.
                  </span>
                </fieldset>
                {grupo('Marca', 'marca', facetas.marcas, atuais.marcas)}
                {grupo('Loja', 'loja', facetas.lojas, atuais.lojas)}
                {grupo('Característica', 'car', facetas.caracteristicas, atuais.caracteristicas)}
              </div>
              <div className="flex items-center gap-2.5 border-t border-solid border-borda px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
                <Link
                  href={urlFiltros(base, { ...manter, sub: atuais.sub })}
                  scroll={false}
                  className="btn btn-ghost"
                  onClick={() => setAberto(false)}
                >
                  Limpar
                </Link>
                <button type="submit" className="btn btn-primary flex-1">
                  Aplicar filtros
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
