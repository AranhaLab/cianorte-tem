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
  /** Ilustração da cidade no fundo das telas de acesso (opcional; sem ela, fundo da marca). */
  fundoAcesso?: { src: string; legenda: string };
  cepsAtendidos: string[]; // prefixos de 5 dígitos
  dominios: string[]; // hosts que resolvem para este tenant
  razaoSocialOperadora: string; // identificação do fornecedor (Decreto 7.962/2013)
  cnpjOperadora: string;
  enderecoOperadora: string;
  dpo: { nome: string; email: string } | null;
}

/* ---------- Catálogo ---------- */
export type IconeCategoria =
  'shirt' | 'hammer' | 'bed' | 'sofa' | 'cart' | 'phone' | 'ball' | 'drop' | 'baby' | 'paw' | 'book';

export interface Categoria {
  id: string;
  nome: string;
  icone: IconeCategoria;
  tom: string; // cor de fundo da arte (dado, não token)
  destaque: string;
  proporcaoMidia: '4:5' | '1:1'; // moda 4:5, demais 1:1 (CLAUDE.md §3)
  subcategorias: Subcategoria[];
}

export interface Subcategoria {
  id: string; // único dentro da categoria
  nome: string;
}

export type Selo = 'oficial' | 'indicada' | null;

export interface Loja {
  id: string;
  nome: string;
  categoriaId: string;
  logo?: string;
  selo: Selo;
  bairro: string;
  entrega: boolean;
  retirada: boolean;
  tarifaKmCentavos: Centavos;
  freteGratisAPartirDe: Centavos | null; // definido pela loja [PROPOSTA]
  prazo: string; // texto de previsão exibido ao comprador
  nota: number;
  avaliacoes: number;
  itensVendidos?: number;
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
  kit: Kit | null;
  subcategoriaId: string | null;
  marca: string | null;
  caracteristicas: string[]; // usadas nos filtros laterais
  /** Galeria em ordem definida pelo lojista (até 20). A 1ª é a capa do cartão. */
  midias: Midia[];
  /** Produto digital (download): não gera frete e é liberado após o pagamento (PRD-15). */
  digital: ArquivoDigital | null;
  vendidos: number; // ordena "Mais vendidos"
  emAlta: number; // ordena "Em alta"
}

/** Arquivo de produto digital. Fica em armazenamento PRIVADO; o link de download é temporário. */
export interface ArquivoDigital {
  formato: 'PDF' | 'EPUB' | 'ZIP';
  tamanhoBytes: number;
  limiteDownloads: number; // [PROPOSTA] downloads permitidos por compra
  validadeDias: number; // [PROPOSTA] dias de acesso após o pagamento
}

/** Foto ou vídeo do produto. Fotos: 4:5 (moda) ou 1:1; vídeo sempre 9:16 (CLAUDE.md §3). */
export interface Midia {
  id: string;
  tipo: 'imagem' | 'video';
  legenda: string; // texto alternativo
  /** Só na demonstração: variação do desenho de exemplo. Some quando houver arquivo real (url). */
  variante: number;
  url?: string;
}

/**
 * Kit (PRD-05): pelo menos 2 produtos distintos da mesma loja; consome o estoque dos componentes.
 * - fechado: composição fixa, preço do próprio kit;
 * - aberto ("monte o seu"): o comprador escolhe entre as opções; preço = soma − desconto do kit.
 */
export interface Kit {
  tipo: 'fechado' | 'aberto';
  componentes: ComponenteKit[]; // fechado: composição; aberto: opções de escolha
  minimoItens: number; // aberto: mínimo de itens distintos escolhidos (≥ 2)
  maximoItens: number;
  descontoPercentual: number; // aberto: desconto sobre a soma dos escolhidos
}

export interface ComponenteKit {
  produtoId: string;
  quantidade: number;
}

/* ---------- Publicidade ---------- */
export type VagaId = 'H1' | 'M1' | 'M2' | 'C1' | 'K1' | 'L1' | 'T1';
export type StatusVaga = 'disponivel' | 'leilao' | 'ocupado';

/** [PROPOSTA] Como a vaga é comprada: só por lance (H1) ou compra direta pelo valor de tabela. */
export type ModoCompraVaga = 'lance' | 'direta';

export interface VagaAnuncio {
  id: VagaId;
  modoCompra: ModoCompraVaga;
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
  categoriaId?: string;
  titulo: string;
  sub: string;
  cta: string;
  fundo: string; // cores do criativo são dado do anunciante
  texto: string;
  destaque?: string;
  href: string;
  anunciante: string; // sempre exibido junto de "Patrocinado" (CLAUDE.md §6)
  /** Foto da arte enviada pelo anunciante (moderada). Sem ela, o criativo é só cor e texto. */
  imagem?: string;
  /** Marca do anunciante, sempre visível no anúncio: nome, cor e logo (se houver). */
  marca?: { nome: string; cor: string; logo?: string; lojaId?: string };
  /** "montar": nosso modelo com título/botão sobre a foto. "pronta": a arte já traz o texto. */
  modo?: 'montar' | 'pronta';
  /** Véu para leitura do texto: neutro (padrão), degradê na cor da marca, ou nenhum (só arte pronta). */
  efeito?: EfeitoArte;
  /** Enquadramento da foto: zoom (1 a 3) e foco em % (0 a 100). */
  enquadramento?: { zoom: number; x: number; y: number };
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

export type ModoEntrega = 'entrega' | 'retirada' | 'digital';
export type FormaPagamento = 'pix' | 'cartao';

export interface Subpedido {
  id: string; // '10501-A'
  lojaId: string;
  modo: ModoEntrega;
  status: StatusSubpedido;
  /** Cópia do que foi comprado no momento da compra (CLAUDE.md §10). */
  itens: ItemPedido[];
}

export interface ItemPedido {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitarioCentavos: Centavos;
  opcao: string | null;
  digital: ArquivoDigital | null;
}

/* ---------- Chat pós-compra (PRD-13) ---------- */
export interface MensagemChat {
  id: string;
  autor: 'comprador' | 'loja';
  texto: string;
  imagem?: { nome: string; tamanhoBytes: number; tipo: string; previa?: string };
  enviadaEm: string; // ISO
}

/** Uma conversa por subpedido: comprador e a loja daquele subpedido, mais ninguém. */
export interface Conversa {
  subpedidoId: string; // '10501-A'
  pedidoId: string;
  lojaId: string;
  cliente: string;
  mensagens: MensagemChat[];
  lidaPelaLoja: number; // quantas mensagens a loja já viu
  lidaPeloComprador: number;
}

export interface Pedido {
  id: string;
  criadoEm: string;
  totalCentavos: Centavos;
  pagamento: FormaPagamento;
  pago: boolean;
  pagoEm?: string; // confirmação do pagamento (conta o prazo e libera downloads)
  subpedidos: Subpedido[];
}

/* ---------- Sacola ---------- */
export interface ItemSacola {
  chave: string; // `${produtoId}|${opcao}|${composição}`
  produtoId: string;
  opcao: string | null;
  quantidade: number;
  /** Kit aberto: o que o comprador escolheu (sai do estoque de cada componente). */
  composicao?: ComponenteKit[];
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

/** Véu neutro (padrão), degradê na cor da marca, ou nenhum (só para arte pronta). */
export type EfeitoArte = 'veu' | 'degrade' | 'nenhum';

/** Estados da campanha (CLAUDE.md §9.3). A arte só pode ser enviada depois da compra. */
export type StatusCampanha =
  | 'lance_ativo'
  | 'lance_superado'
  | 'aguardando_arte'
  | 'arte_em_analise'
  | 'no_ar'
  | 'encerrada'
  | 'reprovada';

/** Arte montada pelo lojista no editor (depois da compra). */
export interface ArteAnuncio {
  modo: 'montar' | 'pronta';
  imagem: { nome: string; tamanhoBytes: number; largura: number; altura: number; dados: string };
  enquadramento: { zoom: number; x: number; y: number };
  efeito: EfeitoArte;
  cor: string; // cor da marca (dado do anunciante)
  titulo: string; // na arte pronta: texto alternativo (o que a arte diz)
  sub: string;
  cta: string;
  destino: string;
}

export interface Campanha {
  id: string;
  vaga: VagaId;
  categoriaId?: string;
  status: StatusCampanha;
  origem: 'lance' | 'direta';
  valorDiaCentavos: Centavos;
  periodo: string;
  arte?: ArteAnuncio;
  /** T1 (letreiro): só texto curto e destino do clique. */
  letreiro?: { texto: string; destino: string };
  motivoReprovacao?: string;
}

export interface ModuloVitrine {
  tipo: string;
  detalhe: string;
}

/** Unidade/filial (Estabelecimento, §4): cadastro e aprovação próprios; não aprovada não vende. */
export interface Unidade {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  cep: string;
  horario: string;
  status: StatusCadastroLoja;
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
