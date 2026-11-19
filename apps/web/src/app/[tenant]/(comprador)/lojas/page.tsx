import type { Metadata } from 'next';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { CartaoLoja, GradeLojas } from '@/components/vitrine/CartaoLoja';
import { api } from '@/lib/api';
import { getTenant } from '@/lib/tenant';

export const revalidate = 300;

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTenant((await params).tenant);
  return { title: `Lojas de ${t.nome}` };
}

/** Protótipo: vLojas. */
export default async function Lojas({ params }: Props) {
  const slug = (await params).tenant;
  const [t, lojas, categorias] = await Promise.all([
    getTenant(slug),
    api.lojas.listar(slug),
    api.categorias.listar(slug),
  ]);
  const cat = new Map(categorias.map((c) => [c.id, c]));
  return (
    <>
      <CabecalhoPagina
        titulo={`Lojas de ${t.nome}`}
        apoio={`Todas aprovadas pela equipe ${t.marca}, com CNPJ e endereço na cidade.`}
      />
      <div className="my-[26px]">
        {lojas.length ? (
          <GradeLojas>
            {lojas.map((l) => (
              <CartaoLoja key={l.id} loja={l} categoria={cat.get(l.categoriaId)} cidade={t.nome} />
            ))}
          </GradeLojas>
        ) : (
          <CaixaVazia
            icone="store"
            titulo="Nenhuma loja ainda"
            texto={`As primeiras lojas de ${t.nome} estão chegando.`}
          />
        )}
      </div>
    </>
  );
}
