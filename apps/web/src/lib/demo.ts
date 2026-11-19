/**
 * Modo demonstração: liga "Simular pagamento", "Simular aprovação" e /dev/tokens.
 * Em produção, NEXT_PUBLIC_DEMO_MODE=false e esses atalhos não existem na tela.
 */
export const MODO_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
