import { notFound } from 'next/navigation';
import { Conta } from '@/components/conta/Conta';
import { ExigeLogin } from '@/components/conta/ExigeLogin';
import { ABAS_CONTA } from '@/lib/conta';

export const metadata = { title: 'Minha conta', robots: { index: false } };

/** Protótipo: vConta. Abas: dados, pedidos, endereços, favoritos e privacidade. */
export default async function PaginaConta({ params }: { params: Promise<{ aba: string }> }) {
  const { aba } = await params;
  if (!ABAS_CONTA.some(([id]) => id === aba)) notFound();
  return (
    <ExigeLogin>
      <Conta aba={aba} />
    </ExigeLogin>
  );
}
