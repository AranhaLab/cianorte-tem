import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import type { Categoria } from '@/types/domain';

/** Atalhos de categoria da home: rolagem no celular, 10 colunas no desktop. */
export function AtalhosCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <section className="my-[26px]" aria-label="Categorias">
      <div className="sem-barra grid auto-cols-[88px] grid-flow-col gap-2.5 overflow-x-auto pb-2 pt-1 xl:grid-flow-row xl:grid-cols-10">
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.id}`}
            className="group flex flex-col items-center gap-2 text-center text-xs font-semibold leading-[1.25] text-grafite hover:text-grafite"
          >
            <span className="relative flex h-16 w-16 items-center justify-center rounded-[20px] border border-solid border-borda bg-branco text-marinho after:absolute after:inset-1 after:rounded-[16px] after:border after:border-dashed after:border-azul-borda after:content-[''] group-hover:border-azul group-hover:text-azul">
              <Icone nome={c.icone} tamanho="lg" />
            </span>
            {c.nome}
          </Link>
        ))}
      </div>
    </section>
  );
}
