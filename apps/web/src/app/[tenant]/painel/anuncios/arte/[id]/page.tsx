import { EditorArte } from '@/components/painel/EditorArte';

export const metadata = { title: 'Arte do anúncio' };

/** No back-end: GET/POST /v1/anuncios/criativos — o servidor confere se a campanha é da loja. */
export default async function Pagina({ params }: { params: Promise<{ id: string }> }) {
  return <EditorArte campanhaId={(await params).id} />;
}
