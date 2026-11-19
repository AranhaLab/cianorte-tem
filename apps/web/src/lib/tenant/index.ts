import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import type { Tenant } from '@/types/domain';
import { hexToRgbTriplet, mixRgb } from './resolve';

/**
 * getTenant(): única porta de entrada para a configuração da cidade.
 * Páginas recebem o slug pelo segmento [tenant] (o middleware reescreve o host
 * para /<slug>/...), o que permite SSR/ISR por cidade.
 */
export async function getTenant(slug: string): Promise<Tenant> {
  const tenant = await api.tenant.obter(slug);
  if (!tenant) notFound();
  return tenant;
}

/** Variáveis CSS do acento da cidade, aplicadas no <html> pelo layout do tenant. */
export function tenantCssVars(t: Tenant): Record<string, string> {
  return {
    '--acento-rgb': hexToRgbTriplet(t.acento),
    '--acento-escuro-rgb': mixRgb(t.acento, 'preto', 0.22),
    '--acento-claro-rgb': mixRgb(t.acento, 'branco', 0.9),
  };
}
