import Link from 'next/link';
import { CabecalhoPagina } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { GradeCategorias } from '@/components/vitrine/GradeCategorias';
import { api } from '@/lib/api';

export const revalidate = 300;
export const metadata = { title: 'Categorias' };

/** Protótipo: vCategorias. */
export default async function Categorias({ params }: { params: Promise<{ tenant: string }> }) {
  const categorias = await api.categorias.listar((await params).tenant);
  const contagem = Object.fromEntries(categorias.map((c) => [c.id, c.totalProdutos]));
  return (
    <>
      <CabecalhoPagina titulo="Categorias" />
      <div className="mt-3.5">
        <GradeCategorias categorias={categorias} contagem={contagem} />
      </div>
      <div className="my-[26px]">
        <Link href="/lojas" className="btn btn-ghost w-full">
          <Icone nome="store" />
          Ver todas as lojas
        </Link>
      </div>
    </>
  );
}
