import Link from 'next/link';
import { Icone, type NomeIcone } from '@/components/ui/Icone';

export function CabecalhoSecao({
  id,
  titulo,
  kicker,
  icone,
  verTodos,
  textoVerTodos = 'Ver todos',
  claro = false,
}: {
  id: string;
  titulo: string;
  kicker?: string;
  icone?: NomeIcone;
  verTodos?: string;
  textoVerTodos?: string;
  claro?: boolean; // sobre fundo marinho
}) {
  return (
    <div className="mb-3.5 flex items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        {kicker && <span className={`kicker ${claro ? 'text-azul-claro' : ''}`}>{kicker}</span>}
        <h2 id={`h-${id}`} className={`flex items-center gap-2 ${claro ? 'text-branco' : ''}`}>
          {icone && <Icone nome={icone} />}
          {titulo}
        </h2>
      </div>
      {verTodos && (
        <Link
          href={verTodos}
          className={`inline-flex min-h-toque items-center text-[13px] font-semibold ${
            claro ? 'text-branco hover:text-sobre-marinho-claro' : 'hover:text-marinho'
          }`}
        >
          {textoVerTodos}
        </Link>
      )}
    </div>
  );
}
