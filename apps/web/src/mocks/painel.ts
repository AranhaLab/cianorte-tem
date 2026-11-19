/** Painel do lojista logado (mock de GET /v1/painel/*). Fictício. */
import type { PainelLojista } from '@/types/domain';

export const PAINEL_DEMO: PainelLojista = {
  lojaId: 'vale-azul',
  status: 'aprovada',
  visivel: true,
  responsavel: '[Nome do responsável]',
  integracao: {
    chaveMascarada: 'ct_live_8f3a••••••••••••••••2b9c',
    ultimaSync: 'há 4 min',
    modo: 'api',
    reservaSeguranca: 2,
    falhas24h: 0,
  },
  pedidos: [
    {
      id: '10482-A',
      cliente: 'Comprador #1',
      itens: 2,
      totalCentavos: 21980,
      modo: 'entrega',
      status: 'pagamento_confirmado',
      quando: 'Hoje 10:42',
    },
    {
      id: '10479-B',
      cliente: 'Comprador #2',
      itens: 1,
      totalCentavos: 8990,
      modo: 'retirada',
      status: 'pronto_retirada',
      quando: 'Hoje 09:15',
    },
    {
      id: '10471-A',
      cliente: 'Comprador #3',
      itens: 3,
      totalCentavos: 34970,
      modo: 'entrega',
      status: 'saiu_entrega',
      quando: 'Ontem 17:30',
    },
    {
      id: '10466-C',
      cliente: 'Comprador #4',
      itens: 1,
      totalCentavos: 12990,
      modo: 'entrega',
      status: 'entregue',
      quando: 'Ontem 11:02',
    },
    {
      id: '10460-A',
      cliente: 'Comprador #5',
      itens: 2,
      totalCentavos: 16480,
      modo: 'retirada',
      status: 'retirado',
      quando: '16/11',
    },
  ],
  estoque: [
    { produtoId: 'p1', sku: 'VA-CSL-001', saldo: 42, minimo: 10 },
    { produtoId: 'p2', sku: 'VA-CJF-002', saldo: 18, minimo: 8 },
    { produtoId: 'p4', sku: 'VA-JJI-004', saldo: 6, minimo: 8 },
    { produtoId: 'p23', sku: 'VA-DRY-023', saldo: 0, minimo: 5 },
  ],
  campanhas: [
    // H1 só por lance: lance da loja está vencendo a disputa.
    {
      id: 'cp1',
      vaga: 'H1',
      status: 'lance_ativo',
      origem: 'lance',
      valorDiaCentavos: 200000,
      periodo: '20/11 a 26/11',
    },
    // M1 comprada direto pelo valor de tabela: espaço garantido, falta enviar a arte.
    {
      id: 'cp2',
      vaga: 'M1',
      status: 'aguardando_arte',
      origem: 'direta',
      valorDiaCentavos: 50000,
      periodo: '22/11 a 28/11',
    },
  ],
  vitrine: [
    { tipo: 'Banner horizontal', detalhe: '1 imagem · 1200 × 300 px' },
    { tipo: 'Produtos em carrossel', detalhe: '8 produtos · mais vendidos da loja' },
    { tipo: 'Mosaico', detalhe: 'até 4 imagens' },
    { tipo: 'Produtos em grade', detalhe: '12 produtos · ordem manual' },
    { tipo: 'Categorias da loja', detalhe: 'Camisaria, Jeans, Infantil' },
  ],
  equipe: [
    {
      nome: '[Responsável]',
      email: 'responsavel@loja.com.br',
      papel: 'Responsável',
      permissoes: ['Pedidos', 'Produtos', 'Estoque', 'Financeiro', 'Anúncios', 'Equipe'],
    },
    {
      nome: '[Atendente]',
      email: 'balcao@loja.com.br',
      papel: 'Atendimento',
      permissoes: ['Pedidos', 'Estoque'],
    },
    {
      nome: '[Marketing]',
      email: 'marketing@loja.com.br',
      papel: 'Marketing',
      permissoes: ['Produtos', 'Anúncios'],
    },
  ],
};
