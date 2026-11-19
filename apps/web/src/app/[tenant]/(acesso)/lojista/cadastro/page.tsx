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
      titulo={`Venda para toda ${tenant.nome}.`}
      apoio={`Sua loja aberta 24 horas, com o apoio da ${tenant.associacao}.`}
      destaques={[
        ['doc', 'Cadastro com CNPJ, aprovação em até 2 dias úteis'],
        ['box', 'Estoque ligado ao sistema da sua loja'],
        ['truck', 'Entrega própria ou retirada no balcão'],
      ]}
    >
      <CadastroLojistaNovo />
    </FundoAcesso>
  );
}
