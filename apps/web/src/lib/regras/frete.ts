/**
 * Regras de frete e cobertura (CLAUDE.md §5.2 e §16).
 * No protótipo a distância é fixa; no back-end vem da rota real pelas ruas.
 */
import type { Centavos, Loja, Tenant } from '@/types/domain';

export const DISTANCIA_DEMO_KM = 3.4; // [PROPOSTA] — back-end usa distância da rota real
export const FRETE_MINIMO: Centavos = 600; // [PROPOSTA] R$ 6

/** Prefixo de 5 dígitos do CEP. */
export const prefixoCep = (cep: string): string => cep.replace(/\D/g, '').slice(0, 5);

/** CEP dentro da área atendida pela cidade (tenant). */
export const cepAtendido = (tenant: Pick<Tenant, 'cepsAtendidos'>, cep: string): boolean =>
  tenant.cepsAtendidos.includes(prefixoCep(cep));

/** Frete = distância pelas ruas × tarifa por km da loja, com mínimo. Sem arredondar antes do cálculo. */
export function freteBase(loja: Pick<Loja, 'tarifaKmCentavos'>, distanciaKm = DISTANCIA_DEMO_KM): Centavos {
  return Math.max(FRETE_MINIMO, Math.round(loja.tarifaKmCentavos * distanciaKm));
}

/** Frete grátis por loja: custeado pela loja quando o subtotal DELA atinge o mínimo dela. */
export function freteFinal(
  loja: Pick<Loja, 'tarifaKmCentavos' | 'freteGratisAPartirDe'>,
  subtotalLoja: Centavos,
): Centavos {
  if (loja.freteGratisAPartirDe !== null && subtotalLoja >= loja.freteGratisAPartirDe) return 0;
  return freteBase(loja);
}

/** Progresso para a barra "Faltam R$ X para frete grátis nesta loja". */
export function progressoFreteGratis(loja: Pick<Loja, 'freteGratisAPartirDe'>, subtotalLoja: Centavos) {
  if (loja.freteGratisAPartirDe === null) return null;
  const falta = Math.max(0, loja.freteGratisAPartirDe - subtotalLoja);
  const pct = Math.min(100, Math.round((subtotalLoja / loja.freteGratisAPartirDe) * 100));
  return { falta, pct, atingido: falta === 0 };
}

/** Retirada: grátis e só se a cidade do comprador for a da unidade (sem limite de km). */
export const podeRetirar = (loja: Pick<Loja, 'retirada'>, cepNaCidade: boolean): boolean =>
  loja.retirada && cepNaCidade;
