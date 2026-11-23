import { CadastroLojistaNovo } from '@/components/conta/Autenticacao';
import { FundoAcesso } from '@/components/conta/FundoAcesso';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Cadastre sua loja' };

/** Adesão de lojista: cria o acesso e segue para o cadastro da loja em etapas (§7.1). */
export default async function PaginaCadastroLojista({ params }: { params: Promise<{ tenant: string }> }) {
  const tenant = await getTenant((await params).tenant);
  return (
    <FundoAcesso
      tenant={tenant}
      tela="lojista-cadastro"
      titulo="Venda para toda"
      tituloDestaque={`${tenant.nome}.`}
      apoio={`Sua loja aberta 24 horas, com o apoio da ${tenant.associacao}.`}
      destaques={[
        { icone: 'doc', titulo: 'Cadastro com CNPJ', texto: 'análise em até 2 dias úteis' },
        { icone: 'box', titulo: 'Estoque ligado', texto: 'ao sistema da sua loja' },
        { icone: 'truck', titulo: 'Entrega própria', texto: 'ou retirada no balcão' },
        { icone: 'star', titulo: 'Selos de confiança', texto: 'Loja oficial e Indicada' },
      ]}
      selos={[
        ['lock', 'Acesso seguro'],
        ['shield', 'LGPD'],
        ['medal', `Parceria ${tenant.associacao}`],
      ]}
    >
      <CadastroLojistaNovo />
    </FundoAcesso>
  );
}
