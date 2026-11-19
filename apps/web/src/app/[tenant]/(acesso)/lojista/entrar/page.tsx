import { EntrarLojista } from '@/components/conta/Autenticacao';
import { FundoAcesso } from '@/components/conta/FundoAcesso';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Entrar no painel do lojista' };

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Entrada do lojista. Depois de entrar, volta para a tela do painel de onde veio. */
export default async function PaginaEntrarLojista({ params, searchParams }: Props) {
  const [tenant, sp] = await Promise.all([getTenant((await params).tenant), searchParams]);
  const next = typeof sp.next === 'string' ? sp.next : null;
  return (
    <FundoAcesso
      tenant={tenant}
      titulo={`Sua loja na vitrine de ${tenant.nome}.`}
      apoio={`Pedidos, estoque, anúncios e financeiro num painel só, com o apoio da ${tenant.associacao}.`}
      destaques={[
        ['receipt', 'Pedidos de toda a cidade num lugar só'],
        ['box', 'Estoque ligado ao sistema da sua loja'],
        ['megaphone', 'Anúncios na vitrine e nas categorias'],
      ]}
    >
      <EntrarLojista next={next} />
    </FundoAcesso>
  );
}
