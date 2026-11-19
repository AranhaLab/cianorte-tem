/** Dados fictícios da administração (mock de GET /v1/admin/*). Só Cianorte tem lojas na demo. */
import type { ModoEntrega, StatusSubpedido } from '@/types/domain';

export interface PedidoAdmin {
  id: string; // subpedido
  pedidoId: string;
  lojaId: string;
  cliente: string;
  produtosCentavos: number;
  freteCentavos: number;
  modo: ModoEntrega;
  status: StatusSubpedido;
  pagamento: 'pendente' | 'confirmado' | 'estornado';
  quando: string; // ISO (UTC)
}

export interface DocumentosLoja {
  cartaoCnpj: boolean;
  contratoSocial: boolean;
  registroMarca: boolean;
  contratoAceito: boolean;
}

export interface Candidata {
  id: string;
  nome: string;
  cnpj: string;
  responsavel: string;
  bairro: string;
  categoria: string;
  documentos: DocumentosLoja;
  enviadoEm: string;
}

export interface ItemModeracao {
  id: string;
  lojaId: string;
  produto: string;
  categoriaId: string;
  tipo: 'novo' | 'alteracao';
  campos: string[];
  /** Nome proposto (quando o nome mudou) e trecho da descrição para revisar. */
  nomeNovo?: string;
  descricao: string;
  precoCentavos: number;
  midias: Array<{ tipo: 'imagem' | 'video'; variante: number }>;
  enviadoEm: string;
}

/** Documentos e métricas das lojas já aprovadas (selos, §5.3). */
export const LOJAS_INFO: Record<
  string,
  { documentos: DocumentosLoja; maiorDia: number; mediaDiaria6m: number; aprovadaEm: string }
> = {
  'vale-azul': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: true, contratoAceito: true },
    maiorDia: 64,
    mediaDiaria6m: 22,
    aprovadaEm: '2026-08-02',
  },
  'casa-obra': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: false, contratoAceito: true },
    maiorDia: 148,
    mediaDiaria6m: 112,
    aprovadaEm: '2026-07-15',
  },
  'lar-bordado': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: true, contratoAceito: true },
    maiorDia: 31,
    mediaDiaria6m: 9,
    aprovadaEm: '2026-09-10',
  },
  'moveis-vale': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: true, contratoAceito: true },
    maiorDia: 18,
    mediaDiaria6m: 6,
    aprovadaEm: '2026-07-28',
  },
  'bom-preco': {
    documentos: { cartaoCnpj: true, contratoSocial: false, registroMarca: false, contratoAceito: true },
    maiorDia: 210,
    mediaDiaria6m: 87,
    aprovadaEm: '2026-06-30',
  },
  'ponto-cel': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: false, contratoAceito: true },
    maiorDia: 104,
    mediaDiaria6m: 41,
    aprovadaEm: '2026-08-21',
  },
  'atelie-linho': {
    documentos: { cartaoCnpj: true, contratoSocial: false, registroMarca: false, contratoAceito: true },
    maiorDia: 12,
    mediaDiaria6m: 4,
    aprovadaEm: '2026-10-05',
  },
  'pet-amigo': {
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: false, contratoAceito: true },
    maiorDia: 27,
    mediaDiaria6m: 11,
    aprovadaEm: '2026-10-19',
  },
};

export const CANDIDATAS: Candidata[] = [
  {
    id: 'c1',
    nome: 'Sapataria Passo Firme',
    cnpj: '00.000.000/0011-00',
    responsavel: '[Responsável 1]',
    bairro: 'Zona 7',
    categoria: 'Moda e vestuário',
    documentos: { cartaoCnpj: true, contratoSocial: true, registroMarca: false, contratoAceito: true },
    enviadoEm: '2026-11-18T14:20:00.000Z',
  },
  {
    id: 'c2',
    nome: 'Eletro Center Cianorte',
    cnpj: '00.000.000/0012-00',
    responsavel: '[Responsável 2]',
    bairro: 'Centro',
    categoria: 'Eletrônicos',
    documentos: { cartaoCnpj: false, contratoSocial: false, registroMarca: false, contratoAceito: true },
    enviadoEm: '2026-11-19T09:05:00.000Z',
  },
];

export const FILA_MODERACAO: ItemModeracao[] = [
  {
    id: 'm1',
    lojaId: 'lar-bordado',
    produto: 'Jogo de toalhas bordadas 5 peças',
    categoriaId: 'cama-mesa-banho',
    tipo: 'novo',
    campos: ['produto novo'],
    descricao: 'Toalhas 100% algodão com barrado bordado à mão. Kit com 2 de banho, 2 de rosto e 1 de piso.',
    precoCentavos: 18990,
    midias: [
      { tipo: 'imagem', variante: 0 },
      { tipo: 'imagem', variante: 1 },
      { tipo: 'imagem', variante: 2 },
    ],
    enviadoEm: '2026-11-19T10:12:00.000Z',
  },
  {
    id: 'm2',
    lojaId: 'ponto-cel',
    produto: 'Fone Bluetooth com cancelamento de ruído',
    categoriaId: 'eletronicos',
    tipo: 'alteracao',
    campos: ['nome', 'midias'],
    nomeNovo: 'Fone Bluetooth com cancelamento de ruído — MELHOR PREÇO DA CIDADE',
    descricao: 'Bateria de até 30 h, estojo com carga rápida.',
    precoCentavos: 24990,
    midias: [
      { tipo: 'video', variante: 0 },
      { tipo: 'imagem', variante: 3 },
    ],
    enviadoEm: '2026-11-19T11:40:00.000Z',
  },
];

export const PEDIDOS_GLOBAIS: PedidoAdmin[] = [
  {
    id: '10482-A',
    pedidoId: '10482',
    lojaId: 'vale-azul',
    cliente: 'Comprador #1',
    produtosCentavos: 21980,
    freteCentavos: 0,
    modo: 'entrega',
    status: 'pagamento_confirmado',
    pagamento: 'confirmado',
    quando: '2026-11-19T13:42:00.000Z',
  },
  {
    id: '10482-B',
    pedidoId: '10482',
    lojaId: 'casa-obra',
    cliente: 'Comprador #1',
    produtosCentavos: 15990,
    freteCentavos: 850,
    modo: 'entrega',
    status: 'em_separacao',
    pagamento: 'confirmado',
    quando: '2026-11-19T13:42:00.000Z',
  },
  {
    id: '10481-A',
    pedidoId: '10481',
    lojaId: 'bom-preco',
    cliente: 'Comprador #6',
    produtosCentavos: 8740,
    freteCentavos: 600,
    modo: 'entrega',
    status: 'realizado',
    pagamento: 'pendente',
    quando: '2026-11-19T13:10:00.000Z',
  },
  {
    id: '10479-B',
    pedidoId: '10479',
    lojaId: 'vale-azul',
    cliente: 'Comprador #2',
    produtosCentavos: 8990,
    freteCentavos: 0,
    modo: 'retirada',
    status: 'pronto_retirada',
    pagamento: 'confirmado',
    quando: '2026-11-19T12:15:00.000Z',
  },
  {
    id: '10477-A',
    pedidoId: '10477',
    lojaId: 'ponto-cel',
    cliente: 'Comprador #7',
    produtosCentavos: 129900,
    freteCentavos: 1020,
    modo: 'entrega',
    status: 'pagamento_confirmado',
    pagamento: 'confirmado',
    quando: '2026-11-19T11:02:00.000Z',
  },
  {
    id: '10471-A',
    pedidoId: '10471',
    lojaId: 'vale-azul',
    cliente: 'Comprador #3',
    produtosCentavos: 34970,
    freteCentavos: 0,
    modo: 'entrega',
    status: 'saiu_entrega',
    pagamento: 'confirmado',
    quando: '2026-11-18T20:30:00.000Z',
  },
  {
    id: '10469-A',
    pedidoId: '10469',
    lojaId: 'moveis-vale',
    cliente: 'Comprador #8',
    produtosCentavos: 89900,
    freteCentavos: 2380,
    modo: 'entrega',
    status: 'entregue',
    pagamento: 'confirmado',
    quando: '2026-11-18T16:45:00.000Z',
  },
  {
    id: '10466-C',
    pedidoId: '10466',
    lojaId: 'vale-azul',
    cliente: 'Comprador #4',
    produtosCentavos: 12990,
    freteCentavos: 0,
    modo: 'entrega',
    status: 'entregue',
    pagamento: 'confirmado',
    quando: '2026-11-18T14:02:00.000Z',
  },
  {
    id: '10463-A',
    pedidoId: '10463',
    lojaId: 'lar-bordado',
    cliente: 'Comprador #9',
    produtosCentavos: 4990,
    freteCentavos: 0,
    modo: 'digital',
    status: 'entregue',
    pagamento: 'confirmado',
    quando: '2026-11-17T22:18:00.000Z',
  },
  {
    id: '10460-A',
    pedidoId: '10460',
    lojaId: 'vale-azul',
    cliente: 'Comprador #5',
    produtosCentavos: 16480,
    freteCentavos: 0,
    modo: 'retirada',
    status: 'retirado',
    pagamento: 'confirmado',
    quando: '2026-11-16T15:00:00.000Z',
  },
  {
    id: '10458-B',
    pedidoId: '10458',
    lojaId: 'pet-amigo',
    cliente: 'Comprador #10',
    produtosCentavos: 21800,
    freteCentavos: 720,
    modo: 'entrega',
    status: 'cancelado',
    pagamento: 'estornado',
    quando: '2026-11-16T10:31:00.000Z',
  },
];
