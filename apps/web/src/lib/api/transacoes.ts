/**
 * Escritas: conta, sacola, checkout, pagamento, painel e anúncios (CLAUDE.md §11).
 * Nos mocks, nada é persistido no servidor: o estado de demonstração fica no
 * store do cliente (src/stores). No back-end real, TODA regra abaixo é revalidada
 * no servidor (preço, estoque, cobertura, permissões) — o front nunca é a fonte de verdade.
 */
import type {
  Endereco,
  FormaPagamento,
  ItemSacola,
  ModoEntrega,
  Pedido,
  Usuario,
  VagaId,
} from '@/types/domain';
import { PAINEL_DEMO } from '@/mocks/painel';
import { mock } from './http';

export interface CadastroInput {
  nome: string;
  cpf: string;
  email: string;
  celular: string;
  senha: string;
  aceiteTermos: true; // obrigatório (CLAUDE.md §6)
  declaraMaioridade: true; // obrigatório
  marketing: boolean; // opcional e separado
  versaoTermos: string; // registrada no consentimento
}

export const auth = {
  /** POST /v1/auth/cadastro — o back-end grava Consentimento (data/hora, versão, IP) */
  cadastro: (_t: string, i: CadastroInput): Promise<Usuario> =>
    mock({
      id: crypto.randomUUID(),
      nome: i.nome,
      email: i.email,
      cpf: i.cpf,
      celular: i.celular,
      marketing: i.marketing,
      endereco: null,
    }),
  /** POST /v1/auth/entrar — resposta define cookie de sessão httpOnly */
  entrar: (_t: string, email: string): Promise<Usuario> =>
    mock({
      id: 'demo',
      nome: 'Comprador Demonstração',
      email,
      cpf: '',
      celular: '',
      marketing: false,
      endereco: null,
    }),
  /** POST /v1/auth/sair */
  sair: (_t: string): Promise<void> => mock(undefined),
};

export const me = {
  /** POST /v1/me/privacidade/exportar (portabilidade, LGPD art. 18) */
  exportarDados: (_t: string) => mock({ prazoDias: 15 }),
  /** POST /v1/me/privacidade/excluir — mantém o que a lei exige (ex.: notas fiscais) */
  excluirConta: (_t: string) => mock({ registrado: true }),
};

export const sacola = {
  /** PUT /v1/sacola — por sessão anônima; funde com a do usuário no login */
  salvar: (_t: string, itens: ItemSacola[]) => mock({ itens }),
};

export interface CotacaoInput {
  itens: ItemSacola[];
  endereco: Endereco;
  modos: Record<string, ModoEntrega>; // por loja
}

export const checkout = {
  /** POST /v1/checkout/cotacao — servidor revalida preço, disponibilidade e cobertura */
  cotar: (_t: string, _i: CotacaoInput) => mock({ valido: true }),
  /** POST /v1/pedidos (Idempotency-Key) — gera pedido principal + subpedidos por loja */
  criarPedido: (_t: string, pedido: Pedido, _idempotencyKey: string): Promise<Pedido> => mock(pedido),
};

export const pagamento = {
  /** POST /v1/pedidos/{id}/pagamento — cartão é tokenizado no provedor; nunca passa número/CVV aqui */
  iniciar: (_t: string, pedidoId: string, forma: FormaPagamento) =>
    mock({ pedidoId, forma, pixCopiaECola: forma === 'pix' ? `00020126…${pedidoId}…6304` : null }),
};

export const painel = {
  /** GET /v1/painel/resumo (+ pedidos, produtos, estoque) */
  resumo: (_t: string) => mock(PAINEL_DEMO),
};

export const anuncios = {
  /** POST /v1/anuncios/lances */
  darLance: (_t: string, vaga: VagaId, valorDiaCentavos: number) =>
    mock({ vaga, valorDiaCentavos, status: 'lance_ativo' as const }),
  /** POST /v1/anuncios/contratacoes */
  contratar: (_t: string, vaga: VagaId, totalCentavos: number) =>
    mock({ vaga, totalCentavos, status: 'vencedor_aguardando_arte' as const }),
};
