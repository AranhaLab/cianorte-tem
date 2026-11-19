import type { NomeIcone } from '@/components/ui/Icone';

/** Abas de /conta/[aba]. Fora do componente de cliente para o servidor poder validar a rota. */
export const ABAS_CONTA: Array<[string, NomeIcone, string]> = [
  ['dados', 'user', 'Meus dados'],
  ['pedidos', 'receipt', 'Pedidos'],
  ['downloads', 'download', 'Downloads'],
  ['conversas', 'chat', 'Conversas'],
  ['enderecos', 'pin', 'Endereços'],
  ['favoritos', 'heart', 'Favoritos'],
  ['privacidade', 'shield', 'Privacidade e dados'],
];
