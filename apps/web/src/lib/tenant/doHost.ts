import { TENANTS } from '@/mocks/tenants';
import type { Tenant } from '@/types/domain';
import { resolveTenantSlug } from './resolve';

/**
 * Cidade a partir do host, para rotas que ficam FORA de /[tenant] (manifest,
 * ícones): o middleware não as reescreve. Com o back-end: GET /v1/tenant.
 */
export function tenantDoHost(host: string | null): Tenant | null {
  const slug = resolveTenantSlug(host, process.env.DEFAULT_TENANT ?? 'cianorte');
  return slug ? (TENANTS[slug] ?? null) : null;
}

/** "Cianorte Tem" → "CT" (monograma do ícone do app). */
export const monograma = (marca: string) =>
  marca
    .split(/\s+/)
    .map((p) => p[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
