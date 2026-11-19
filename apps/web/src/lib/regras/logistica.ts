/**
 * Logística da loja (CLAUDE.md §5.2, §7.4 e §16): tarifa por km, distância máxima,
 * frete grátis, horário de corte e retirada. Calendário e fórmula de prazo
 * ainda estão em aberto (PO-05); aqui a previsão é só "hoje" ou "amanhã".
 */
import { cepAtendido, FRETE_MINIMO } from './frete';
import type { Centavos, Tenant } from '@/types/domain';

export interface LogisticaLoja {
  entrega: boolean;
  tarifaKmCentavos: Centavos;
  distanciaMaxKm: number;
  freteGratisAPartirDe: Centavos | null;
  corte: string; // 'HH:MM' em America/Sao_Paulo
  retirada: boolean;
}

export const DISTANCIA_MAX_LIMITE = 50; // [PROPOSTA] km
export const TARIFA_MAX_KM: Centavos = 2000; // [PROPOSTA] R$ 20/km

export function errosLogistica(l: LogisticaLoja): Record<string, string> {
  const e: Record<string, string> = {};
  if (!l.entrega && !l.retirada) e.modos = 'Ofereça entrega, retirada ou as duas.';
  if (l.entrega) {
    if (!(l.tarifaKmCentavos > 0 && l.tarifaKmCentavos <= TARIFA_MAX_KM))
      e.tarifa = 'Tarifa entre R$ 0,01 e R$ 20,00 por km.';
    if (!(l.distanciaMaxKm >= 1 && l.distanciaMaxKm <= DISTANCIA_MAX_LIMITE))
      e.distancia = `Distância entre 1 e ${DISTANCIA_MAX_LIMITE} km.`;
    if (l.freteGratisAPartirDe !== null && !(l.freteGratisAPartirDe > 0))
      e.freteGratis = 'Informe um valor maior que zero ou deixe em branco.';
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(l.corte)) e.corte = 'Horário inválido.';
  return e;
}

/**
 * Distância de DEMONSTRAÇÃO pelo CEP (1 a 15 km, sempre a mesma para o mesmo CEP).
 * No back-end: rota real pelas ruas, do endereço da unidade ao do comprador.
 */
export function distanciaDemoKm(cep: string): number {
  const d = cep.replace(/\D/g, '');
  const soma = [...d].reduce((a, n, i) => a + Number(n) * (i + 1), 0);
  return Math.round((1 + (soma % 141) / 10) * 10) / 10;
}

/** "HH:MM" atual em America/Sao_Paulo. */
export const horaSaoPaulo = (agora: Date) =>
  agora.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23', // meia-noite = 00:00 (com hour12:false alguns navegadores dão 24:00)
    timeZone: 'America/Sao_Paulo',
  });

/** Pago até o corte: sai hoje; depois: amanhã. Mudar o corte só vale para novas compras. */
export const previsao = (corte: string, agora: Date): 'hoje' | 'amanha' =>
  horaSaoPaulo(agora) < corte ? 'hoje' : 'amanha';

export type ResultadoTrajeto =
  | {
      atendido: true;
      distanciaKm: number;
      freteCentavos: Centavos;
      gratisAcima: Centavos | null;
      previsao: 'hoje' | 'amanha';
    }
  | {
      atendido: false;
      distanciaKm: number | null;
      motivo: 'cep_invalido' | 'fora_da_cidade' | 'sem_entrega' | 'distancia';
    };

/** "Trajeto de teste": o lojista confere frete e prazo para um CEP antes de publicar. */
export function simularTrajeto(
  l: LogisticaLoja,
  tenant: Pick<Tenant, 'cepsAtendidos'>,
  cep: string,
  agora = new Date(),
  distanciaKm = distanciaDemoKm(cep),
): ResultadoTrajeto {
  if (cep.replace(/\D/g, '').length !== 8)
    return { atendido: false, distanciaKm: null, motivo: 'cep_invalido' };
  if (!cepAtendido(tenant, cep)) return { atendido: false, distanciaKm: null, motivo: 'fora_da_cidade' };
  if (!l.entrega) return { atendido: false, distanciaKm, motivo: 'sem_entrega' };
  if (distanciaKm > l.distanciaMaxKm) return { atendido: false, distanciaKm, motivo: 'distancia' };
  return {
    atendido: true,
    distanciaKm,
    freteCentavos: Math.max(FRETE_MINIMO, Math.round(l.tarifaKmCentavos * distanciaKm)),
    gratisAcima: l.freteGratisAPartirDe,
    previsao: previsao(l.corte, agora),
  };
}
