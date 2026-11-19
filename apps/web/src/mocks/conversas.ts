/** Conversas de exemplo do painel (pedidos fictícios da loja Vale Azul). */
import type { Conversa } from '@/types/domain';

export const CONVERSAS_DEMO: Conversa[] = [
  {
    subpedidoId: '10482-A',
    pedidoId: '10482',
    lojaId: 'vale-azul',
    cliente: 'Comprador #1',
    lidaPelaLoja: 1,
    lidaPeloComprador: 2,
    mensagens: [
      {
        id: 'm1',
        autor: 'comprador',
        texto: 'Oi! A camisa M veste justo? Costumo usar M em outras marcas.',
        enviadaEm: '2026-11-18T13:44:00.000Z',
      },
      {
        id: 'm2',
        autor: 'loja',
        texto:
          'Oi! O slim fit é mais ajustado. Se preferir folgada, sugerimos a G. Quer que a gente troque antes de enviar?',
        enviadaEm: '2026-11-18T13:52:00.000Z',
      },
      {
        id: 'm3',
        autor: 'comprador',
        texto: 'Pode trocar para G, por favor.',
        enviadaEm: '2026-11-18T13:58:00.000Z',
      },
    ],
  },
  {
    subpedidoId: '10479-B',
    pedidoId: '10479',
    lojaId: 'vale-azul',
    cliente: 'Comprador #2',
    lidaPelaLoja: 2,
    lidaPeloComprador: 2,
    mensagens: [
      {
        id: 'm1',
        autor: 'loja',
        texto: 'Seu pedido está pronto para retirada! Estamos na Zona 1, das 8h às 18h.',
        enviadaEm: '2026-11-18T12:20:00.000Z',
      },
      {
        id: 'm2',
        autor: 'comprador',
        texto: 'Obrigado! Passo aí no fim da tarde.',
        enviadaEm: '2026-11-18T12:31:00.000Z',
      },
    ],
  },
];
