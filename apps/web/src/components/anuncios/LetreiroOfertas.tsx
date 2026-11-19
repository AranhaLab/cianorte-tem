'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { sigla } from '@/lib/regras/arteAnuncio';
import type { CriativoAnuncio } from '@/types/domain';

export type ItemInformativo = { icone: NomeIcone; texto: string; href?: string };

/**
 * Letreiro de ofertas (vaga T1) na barra do topo: frases patrocinadas das lojas,
 * intercaladas com informações da cidade. Cada frase patrocinada leva "Patrocinado"
 * e a marca da loja (CDC e CONAR).
 *
 * Acessibilidade (WCAG 2.2.2): o movimento para com o mouse ou o foco do teclado, tem
 * botão de pausar, e quem pediu "reduzir movimento" no sistema vê a lista parada,
 * com rolagem lateral.
 */
export function LetreiroOfertas({
  anuncios,
  informativos,
}: {
  anuncios: CriativoAnuncio[];
  informativos: ItemInformativo[];
}) {
  const [pausado, setPausado] = useState(false);
  // Intercala: anúncio, informação, anúncio…
  const itens: Array<{ tipo: 'anuncio'; a: CriativoAnuncio } | { tipo: 'info'; i: ItemInformativo }> = [];
  const max = Math.max(anuncios.length, informativos.length);
  for (let k = 0; k < max; k++) {
    if (anuncios[k]) itens.push({ tipo: 'anuncio', a: anuncios[k]! });
    if (informativos[k]) itens.push({ tipo: 'info', i: informativos[k]! });
  }
  if (!itens.length) return null;

  const lista = (copia: boolean) => (
    <ul className="m-0 flex flex-none list-none items-center gap-7 p-0 pr-7" aria-hidden={copia || undefined}>
      {itens.map((it, n) =>
        it.tipo === 'anuncio' ? (
          <li key={`a${n}`} className="flex-none">
            <Link
              href={it.a.href}
              data-anuncio="T1"
              tabIndex={copia ? -1 : undefined}
              className="inline-flex items-center gap-2 whitespace-nowrap text-[13px] text-branco hover:text-branco hover:underline"
            >
              <span
                aria-hidden
                className="flex h-5 w-5 flex-none items-center justify-center rounded-[5px] bg-azul text-[9px] font-bold text-branco"
                style={it.a.marca ? { backgroundColor: it.a.marca.cor } : undefined}
              >
                {sigla(it.a.anunciante)}
              </span>
              <span className="rounded-full bg-branco/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-sobre-marinho-forte">
                Patrocinado · {it.a.anunciante}
              </span>
              {it.a.titulo}
            </Link>
          </li>
        ) : (
          <li
            key={`i${n}`}
            className="flex flex-none items-center gap-1.5 whitespace-nowrap text-[13px] text-sobre-marinho-forte"
          >
            <Icone nome={it.i.icone} tamanho="sm" />
            {it.i.href ? (
              <Link
                href={it.i.href}
                tabIndex={copia ? -1 : undefined}
                className="text-sobre-marinho-forte hover:text-branco"
              >
                {it.i.texto}
              </Link>
            ) : (
              it.i.texto
            )}
          </li>
        ),
      )}
    </ul>
  );

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <div
        className="letreiro relative min-w-0 flex-1 overflow-hidden"
        data-pausado={pausado || undefined}
        role="region"
        aria-label="Ofertas e avisos da cidade"
      >
        <div className="letreiro-trilho flex w-max">
          {lista(false)}
          {lista(true)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setPausado((p) => !p)}
        aria-pressed={pausado}
        aria-label={pausado ? 'Continuar o letreiro' : 'Pausar o letreiro'}
        className="letreiro-pausa inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border-0 bg-transparent text-sobre-marinho-forte hover:bg-branco/10 hover:text-branco"
      >
        <Icone nome={pausado ? 'play' : 'pause'} tamanho="sm" />
      </button>
    </div>
  );
}
