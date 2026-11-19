import { TENANTS } from '@/mocks/tenants';

/**
 * Resolve o slug da cidade a partir do host. Roda no middleware (edge),
 * então não pode depender de Node APIs nem de I/O.
 *
 * Ordem: domínio exato cadastrado → subdomínio (cianorte.qualquer.com) → DEFAULT_TENANT.
 * Quando o back-end existir, a lista de domínios vem de GET /v1/tenant/dominios
 * (com cache), não deste arquivo.
 */
export function resolveTenantSlug(hostHeader: string | null, fallback: string): string | null {
  const host = (hostHeader ?? '').toLowerCase().split(':')[0] ?? '';

  for (const t of Object.values(TENANTS)) {
    if (t.dominios.includes(host)) return t.slug;
  }

  const sub = host.split('.')[0] ?? '';
  if (sub && sub in TENANTS) return sub;

  return fallback in TENANTS ? fallback : null;
}

/** "#D7263D" → "215 38 61" (formato que o Tailwind usa em rgb(var() / alpha)). */
export function hexToRgbTriplet(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Escurece/clareia a cor do acento para gerar as variações do token. */
export function mixRgb(hex: string, alvo: 'preto' | 'branco', peso: number): string {
  const [r, g, b] = hexToRgbTriplet(hex).split(' ').map(Number) as [number, number, number];
  const t = alvo === 'preto' ? 0 : 255;
  const m = (c: number) => Math.round(c + (t - c) * peso);
  return `${m(r)} ${m(g)} ${m(b)}`;
}
