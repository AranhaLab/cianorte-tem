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
      tela="cadastro"
      titulo="Crie sua conta e compre"
      tituloDestaque={`das lojas de ${tenant.nome}.`}
      apoio="Uma conta só para comprar de todas as lojas da cidade, acompanhar pedidos e conversar com as lojas."
      destaques={[
        { icone: 'bag', titulo: 'Sacola com várias lojas', texto: 'um checkout só' },
        { icone: 'chat', titulo: 'Converse com a loja', texto: 'depois da compra' },
        { icone: 'heart', titulo: 'Favoritos e endereços', texto: 'salvos na sua conta' },
        { icone: 'shield', titulo: 'Seus dados protegidos', texto: 'pela LGPD, você decide' },
      ]}
    >
      <Cadastro next={next} />
    </FundoAcesso>
  );
}
