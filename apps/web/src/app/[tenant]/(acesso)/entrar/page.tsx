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
      tela="entrar"
      titulo={`Tudo o que ${tenant.nome} tem,`}
      tituloDestaque="a um toque de você."
      apoio="Compre das lojas da cidade e receba no mesmo dia, ou retire no balcão sem pagar frete."
      destaques={[
        { icone: 'store', titulo: 'Lojas locais verificadas', texto: 'CNPJ e endereço na cidade' },
        { icone: 'truck', titulo: 'Entrega no mesmo dia', texto: 'ou retirada grátis no balcão' },
        { icone: 'lock', titulo: 'Pagamento protegido', texto: 'Pix ou cartão, dados criptografados' },
        { icone: 'refresh', titulo: '7 dias para desistir', texto: 'direito de arrependimento garantido' },
      ]}
    >
      <Entrar next={next} />
    </FundoAcesso>
  );
}
