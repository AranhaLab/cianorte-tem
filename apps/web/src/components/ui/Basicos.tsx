import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { ROTULO_DISPONIBILIDADE } from '@/lib/regras/disponibilidade';
import type { Disponibilidade } from '@/types/domain';
import { Icone, type NomeIcone } from './Icone';

/** Trilha "Início › Categoria › Produto" (protótipo: .crumbs). */
export function Migalhas({ itens }: { itens: Array<{ rotulo: string; href?: string }> }) {
  return (
    <nav
      aria-label="Você está em"
      className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[13px] text-grafite-2"
    >
      {itens.map((i, n) => (
        <Fragment key={i.rotulo}>
          {n > 0 && <Icone nome="chevR" tamanho="sm" />}
          {i.href ? (
            <Link href={i.href} className="text-grafite-2 hover:text-marinho">
              {i.rotulo}
            </Link>
          ) : (
            <span aria-current="page">{i.rotulo}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

/** Título de página com ação opcional à direita (protótipo: .page-head). */
export function CabecalhoPagina({
  titulo,
  kicker,
  apoio,
  acao,
}: {
  titulo: string;
  kicker?: string;
  apoio?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="mt-[18px] flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        {kicker && <span className="kicker">{kicker}</span>}
        <h1>{titulo}</h1>
        {apoio && <span className="text-[13px] text-grafite-2">{apoio}</span>}
      </div>
      {acao}
    </div>
  );
}

/** Estado vazio (protótipo: emptyBox). */
export function CaixaVazia({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: NomeIcone;
  titulo: string;
  texto: string;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-grafite-2">
      <span className="flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-solid border-borda bg-branco text-azul">
        <Icone nome={icone} tamanho="lg" />
      </span>
      <h2>{titulo}</h2>
      <span>{texto}</span>
      {acao}
    </div>
  );
}

const COR_DISP: Record<Disponibilidade, string> = {
  disponivel: 'st-green',
  ultimas_unidades: 'st-amber',
  indisponivel: 'st-gray',
};

/** O comprador vê só o estado, nunca o saldo (CLAUDE.md §5.3). */
export function StatusDisponibilidade({
  disp,
  className = '',
}: {
  disp: Disponibilidade;
  className?: string;
}) {
  return <span className={`status ${COR_DISP[disp]} ${className}`}>{ROTULO_DISPONIBILIDADE[disp]}</span>;
}
