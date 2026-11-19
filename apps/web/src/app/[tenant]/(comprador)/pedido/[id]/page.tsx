import { DetalhePedido } from '@/components/compra/DetalhePedido';
import { ExigeLogin } from '@/components/conta/ExigeLogin';

export const metadata = { title: 'Pedido', robots: { index: false } };

/** Protótipo: vPedido. No back-end: GET /v1/me/pedidos/{id} (só o dono acessa — PRD-01). */
export default async function PaginaPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ExigeLogin>
      <DetalhePedido id={id} />
    </ExigeLogin>
  );
}
