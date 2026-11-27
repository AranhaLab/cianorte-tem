import { Carregando } from '@/components/ui/Carregando';

/**
 * Tela de carregamento desta seção. Não fica na raiz da cidade de propósito: um
 * loading.tsx acima de produto, categoria, loja ou conta faz o Next enviar a página
 * antes de saber se ela existe, e o "não encontrado" responde 200 em vez de 404
 * (CLAUDE.md §13.3 e §13.21).
 */
export default function Loading() {
  return <Carregando mensagem="Carregando página..." />;
}
