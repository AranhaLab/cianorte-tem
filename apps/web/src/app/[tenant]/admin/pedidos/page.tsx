import { PedidosAdmin } from '@/components/admin/TelasOperacao';

export const metadata = { title: 'Pedidos' };

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <PedidosAdmin filtro={typeof sp.f === 'string' ? sp.f : undefined} />;
}
