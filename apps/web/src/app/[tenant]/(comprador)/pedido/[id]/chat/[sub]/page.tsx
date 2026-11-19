import { ChatComprador } from '@/components/chat/ChatComprador';
import { ExigeLogin } from '@/components/conta/ExigeLogin';

export const metadata = { title: 'Conversa com a loja', robots: { index: false } };

/** No back-end: GET /v1/me/pedidos/{id}/conversas/{subpedido} — só o comprador do pedido acessa. */
export default async function PaginaChat({ params }: { params: Promise<{ id: string; sub: string }> }) {
  const { id, sub } = await params;
  return (
    <ExigeLogin>
      <ChatComprador pedidoId={id} subpedidoId={decodeURIComponent(sub)} />
    </ExigeLogin>
  );
}
