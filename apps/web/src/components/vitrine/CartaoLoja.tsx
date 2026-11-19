import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import { iniciais } from '@/lib/vitrine';
import type { Categoria, Loja } from '@/types/domain';
import { SeloLoja } from './SeloLoja';

export function AvatarLoja({
  loja,
  className = 'h-[52px] w-[52px] rounded-[14px] text-lg',
}: {
  loja: Loja;
  className?: string;
}) {
  return (
    <span
      className={`flex flex-none items-center justify-center font-titulo font-bold text-branco ${className}`}
      style={{ backgroundColor: loja.cor }}
      aria-hidden
    >
      {iniciais(loja.nome)}
    </span>
  );
}

export function CartaoLoja({
  loja,
  categoria,
  cidade,
}: {
  loja: Loja;
  categoria?: Categoria;
  cidade: string;
}) {
  return (
    <Link
      href={`/loja/${loja.id}`}
      className="flex items-center gap-3 rounded-[18px] border border-solid border-borda bg-branco p-3.5 text-grafite hover:border-azul hover:text-grafite"
    >
      <AvatarLoja loja={loja} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <b className="text-sm text-marinho">{loja.nome}</b>
        <span className="flex items-center gap-1 text-xs text-grafite-2">
          <Icone nome="star" tamanho="sm" />
          {loja.nota.toFixed(1)} · {loja.bairro}
          {categoria ? ` · ${categoria.nome}` : ''}
        </span>
        <span className="flex flex-wrap gap-1">
          <span className="pill pill-local">
            <Icone nome="pin" tamanho="sm" />
            Loja de {cidade}
          </span>
          <SeloLoja selo={loja.selo} />
        </span>
      </span>
    </Link>
  );
}

export function GradeLojas({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
