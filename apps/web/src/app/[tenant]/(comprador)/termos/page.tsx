import { TextoLegal } from '@/components/conta/TextoLegal';
import { getTenant } from '@/lib/tenant';

export const metadata = { title: 'Termos de Uso' };

/** Protótipo: vLegal('termos'). */
export default async function Termos({ params }: { params: Promise<{ tenant: string }> }) {
  const t = await getTenant((await params).tenant);
  return (
    <TextoLegal titulo="Termos de Uso">
      <h3>1. Quem somos</h3>
      <p>
        O {t.marca} é uma plataforma que conecta compradores a lojas de {t.nome}. Cada loja é a fornecedora
        dos produtos que vende e responde por eles junto com a plataforma, nos termos do Código de Defesa do
        Consumidor.
      </p>
      <h3 id="trocas">2. Arrependimento e trocas</h3>
      <p>
        Compras online podem ser canceladas em até 7 dias após o recebimento, com devolução integral dos
        valores (art. 49 do CDC). Produtos com defeito seguem a garantia legal de 90 dias.
      </p>
      <h3>3. Pagamentos</h3>
      <p>
        Pagamentos são processados por provedor de pagamento parceiro. O valor é repassado a cada loja
        descontadas comissão e taxas, conforme contrato do lojista.
      </p>
      <h3>4. Conta</h3>
      <p>
        Você pode navegar e montar a sacola sem conta. Para comprar, é preciso cadastro com dados verdadeiros
        e ter 18 anos ou mais.
      </p>
    </TextoLegal>
  );
}
