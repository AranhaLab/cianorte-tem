import { TextoLegal } from '@/components/conta/TextoLegal';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Política de Privacidade' };

/** Protótipo: vLegal('privacidade'). */
export default async function Privacidade({ params }: { params: Promise<{ tenant: string }> }) {
  const t = await getTenant((await params).tenant);
  return (
    <TextoLegal titulo="Política de Privacidade">
      <h3>1. Dados que coletamos</h3>
      <p>
        Cadastro (nome, CPF, e-mail, celular), endereços, pedidos e dados de navegação. Dados de cartão ficam
        com o provedor de pagamento.
      </p>
      <h3>2. Para que usamos</h3>
      <p>
        Executar compras e entregas, emitir notas, prevenir fraudes, cumprir obrigações legais e — só com seu
        consentimento — enviar ofertas e personalizar anúncios.
      </p>
      <h3>3. Com quem compartilhamos</h3>
      <p>
        Com a loja de cada pedido (só o necessário para entregar), o provedor de pagamento e serviços de
        entrega e mensagens.
      </p>
      <h3 id="cookies">4. Cookies</h3>
      <p>
        Necessários (sempre ativos), de medição e de anúncios (opcionais). Você muda a escolha a qualquer
        momento em Conta › Privacidade.
      </p>
      <h3>5. Seus direitos</h3>
      <p>
        Acesso, correção, portabilidade, exclusão e revogação de consentimento. Contato do encarregado:{' '}
        {t.dpo ? t.dpo.email : '[e-mail]'}.
      </p>
    </TextoLegal>
  );
}
