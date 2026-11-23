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
      tela="lojista-entrar"
      titulo="Sua loja na vitrine"
      tituloDestaque={`de ${tenant.nome}.`}
      apoio={`Pedidos, estoque, anúncios e financeiro num painel só, com o apoio da ${tenant.associacao}.`}
      destaques={[
        { icone: 'receipt', titulo: 'Pedidos num lugar só', texto: 'entrega e retirada por loja' },
        { icone: 'box', titulo: 'Estoque sincronizado', texto: 'manual, planilha ou API' },
        { icone: 'megaphone', titulo: 'Anúncios na vitrine', texto: 'home, categorias e letreiro' },
        { icone: 'chart', titulo: 'Financeiro claro', texto: 'vendas, comissão e repasse' },
      ]}
      selos={[
        ['lock', 'Acesso seguro'],
        ['shield', 'LGPD'],
        ['medal', `Parceria ${tenant.associacao}`],
      ]}
    >
      <EntrarLojista next={next} />
    </FundoAcesso>
  );
}
