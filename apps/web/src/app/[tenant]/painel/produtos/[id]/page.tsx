import { EditorProduto } from '@/components/painel/EditorProduto';

export const metadata = { title: 'Editar produto' };

/** No back-end: GET/PATCH /v1/painel/produtos/{id} — o servidor confere se o produto é da loja. */
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorProduto produtoId={id} />;
}
