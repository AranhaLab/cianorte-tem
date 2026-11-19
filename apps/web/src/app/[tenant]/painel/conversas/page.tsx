import { ConversasLojista } from '@/components/painel/ConversasLojista';

export const metadata = { title: 'Conversas' };

/** No back-end: GET /v1/painel/conversas (só as da loja; equipe precisa da permissão "Pedidos"). */
export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = (await searchParams).c;
  return <ConversasLojista selecionada={typeof c === 'string' ? c : undefined} />;
}
