/**
 * Tipos de domínio do front. Espelham as entidades da seção 10 do CLAUDE.md
 * no formato que a API (seção 11) devolve ao front.
 *
 * Convenções que o back-end também segue:
 * - dinheiro em CENTAVOS (inteiro) — nunca float;
 * - datas ISO 8601 em UTC; o front exibe em America/Sao_Paulo;
 * - ids são strings opacas.
 */

export type Centavos = number;

/* ---------- White label ---------- */
export interface Tenant {
  slug: string; // 'cianorte'
  nome: string; // 'Cianorte'
  marca: string; // 'Cianorte Tem'
  uf: string;
  cepPadrao: string; // '87200-000'
  acento: string; // hex da etiqueta "Tem" (bandeira da cidade)
  associacao: string; // associação comercial parceira (ex.: ACIC)
  slogan: string;
  cepsAtendidos: string[]; // prefixos de 5 dígitos
  dominios: string[]; // hosts que resolvem para este tenant
  razaoSocialOperadora: string; // identificação do fornecedor (Decreto 7.962/2013)
  cnpjOperadora: string;
  enderecoOperadora: string;
  dpo: { nome: string; email: string } | null;
}

/* ---------- Catálogo ---------- */
export type IconeCategoria =
  'shirt' | 'hammer' | 'bed' | 'sofa' | 'cart' | 'phone' | 'ball' | 'drop' | 'baby' | 'paw';

export interface Categoria {
  id: string;
  nome: string;
  icone: IconeCategoria;
  tom: string; // cor de fundo da arte (dado, não token)
  destaque: string;
  proporcaoMidia: '4:5' | '1:1'; // moda 4:5, demais 1:1 (CLAUDE.md §3)
}

export type Selo = 'oficial' | 'indicada' | null;

export interface Loja {
  id: string;
  nome: string;
  categoriaId: string;
  selo: Selo;
  bairro: string;
  entrega: boolean;
  retirada: boolean;
  tarifaKmCentavos: Centavos;
  freteGratisAPartirDe: Centavos | null; // definido pela loja [PROPOSTA]
  prazo: string; // texto de previsão exibido ao comprador
  nota: number;
  avaliacoes: number;
  cnpj: string;
  cor: string; // cor do avatar (dado, não token)
}

/** O comprador NUNCA recebe saldo numérico. Só este estado (CLAUDE.md §5.3). */
export type Disponibilidade = 'disponivel' | 'ultimas_unidades' | 'indisponivel';

export interface Variacao {
  nome: string; // 'Tamanho'
  opcoes: string[];
}

export interface Produto {
  id: string;
  nome: string;
  lojaId: string;
  categoriaId: string;
  precoCentavos: Centavos;
  precoDeCentavos: Centavos | null;
  disponibilidade: Disponibilidade;
  variacao: Variacao | null;
  kit: boolean;
  vendidos: number; // ordena "Mais vendidos"
  emAlta: number; // ordena "Em alta"
}

/* ---------- Publicidade ---------- */
export type VagaId = 'H1' | 'M1' | 'M2' | 'C1' | 'K1' | 'L1';
export type StatusVaga = 'disponivel' | 'leilao' | 'ocupado';

export interface VagaAnuncio {
  id: VagaId;
  nome: string;
  pagina: 'home' | 'categoria';
  posicao: string;
  formato: { desktop: string; mobile: string; proporcao: string };
  precoDiaCentavos: Centavos;
  rotacao: number;
  status: StatusVaga;
  lanceAtualCentavos: Centavos | null;
  lances: number;
  terminaEm: string | null;
  ocupadoAte: string | null;
}

export interface CriativoAnuncio {
  vaga: VagaId;
  titulo: string;
  sub: string;
  cta: string;
  fundo: string; // cores do criativo são dado do anunciante
  texto: string;
  destaque?: string;
  href: string;
  anunciante: string; // sempre exibido junto de "Patrocinado" (CLAUDE.md §6)
}

/* ---------- Pedidos ---------- */
export type StatusSubpedido =
  | 'realizado'
  | 'pagamento_confirmado'
  | 'em_separacao'
  | 'pronto_envio'
  | 'saiu_entrega'
  | 'entregue'
  | 'pronto_retirada'
  | 'retirado'
  | 'cancelado';

export type ModoEntrega = 'entrega' | 'retirada';
export type FormaPagamento = 'pix' | 'cartao';

export interface Subpedido {
  id: string; // '10501-A'
  lojaId: string;
  modo: ModoEntrega;
  status: StatusSubpedido;
}

export interface Pedido {
  id: string;
  criadoEm: string;
  totalCentavos: Centavos;
  pagamento: FormaPagamento;
  pago: boolean;
  subpedidos: Subpedido[];
}

/* ---------- Sacola ---------- */
export interface ItemSacola {
  chave: string; // `${produtoId}|${opcao}`
  produtoId: string;
  opcao: string | null;
  quantidade: number;
}

/* ---------- Comprador ---------- */
export interface Endereco {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  complemento: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  marketing: boolean;
  endereco: Endereco | null;
}

/* ---------- Painel do lojista ---------- */
export type StatusCadastroLoja = 'rascunho' | 'em_analise' | 'aprovada' | 'reprovada' | 'suspensa';
export type ModoSincronizacao = 'manual' | 'planilha' | 'api';

export interface PedidoLojista {
  id: string;
  cliente: string;
  itens: number;
  totalCentavos: Centavos;
  modo: ModoEntrega;
  status: StatusSubpedido;
  quando: string;
}

export interface EstoqueItem {
  produtoId: string;
  sku: string;
  saldo: number; // só o lojista vê
  minimo: number;
}

export interface MembroEquipe {
  nome: string;
  email: string;
  papel: string;
  permissoes: Array<'Pedidos' | 'Produtos' | 'Estoque' | 'Financeiro' | 'Anúncios' | 'Equipe'>;
}

export interface Campanha {
  vaga: VagaId;
  status: string;
  valorDiaCentavos: Centavos;
  periodo: string;
}

export interface ModuloVitrine {
  tipo: string;
  detalhe: string;
}

export interface PainelLojista {
  lojaId: string;
  status: StatusCadastroLoja;
  visivel: boolean;
  responsavel: string;
  integracao: {
    chaveMascarada: string;
    ultimaSync: string;
    modo: ModoSincronizacao;
    reservaSeguranca: number;
    falhas24h: number;
  };
  pedidos: PedidoLojista[];
  estoque: EstoqueItem[];
  campanhas: Campanha[];
  vitrine: ModuloVitrine[];
  equipe: MembroEquipe[];
}
