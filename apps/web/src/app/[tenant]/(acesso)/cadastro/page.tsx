import { Cadastro } from '@/components/conta/Autenticacao';
import { FundoAcesso } from '@/components/conta/FundoAcesso';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Criar conta' };

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Criar conta (LGPD: §6). `?next=` é a tela para onde voltar depois. */
export default async function PaginaCadastro({ params, searchParams }: Props) {
  const [tenant, sp] = await Promise.all([getTenant((await params).tenant), searchParams]);
  const next = typeof sp.next === 'string' ? sp.next : null;
  return (
    <FundoAcesso
      tenant={tenant}
      titulo={`Crie sua conta no ${tenant.marca}.`}
      apoio="Uma conta só para comprar de todas as lojas da cidade, acompanhar pedidos e conversar com as lojas."
      destaques={[
        ['bag', 'Sacola com várias lojas, um checkout só'],
        ['chat', 'Converse com a loja depois da compra'],
        ['lock', 'Seus dados protegidos pela LGPD'],
      ]}
    >
      <Cadastro next={next} />
    </FundoAcesso>
  );
}
