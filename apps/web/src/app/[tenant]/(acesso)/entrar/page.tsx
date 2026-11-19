import { Entrar } from '@/components/conta/Autenticacao';
import { FundoAcesso } from '@/components/conta/FundoAcesso';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Entrar' };

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Entrar como comprador. `?next=` (lido no servidor) é a tela para onde voltar. */
export default async function PaginaEntrar({ params, searchParams }: Props) {
  const [tenant, sp] = await Promise.all([getTenant((await params).tenant), searchParams]);
  const next = typeof sp.next === 'string' ? sp.next : null;
  return (
    <FundoAcesso
      tenant={tenant}
      titulo={`O comércio de ${tenant.nome} num lugar só.`}
      apoio="Compre das lojas da sua cidade, receba no mesmo dia ou retire no balcão."
      destaques={[
        ['store', `Só lojas de ${tenant.nome}`],
        ['truck', 'Entrega no mesmo dia ou retirada sem frete'],
        ['shield', 'Pagamento protegido e 7 dias para desistir'],
      ]}
    >
      <Entrar next={next} />
    </FundoAcesso>
  );
}
