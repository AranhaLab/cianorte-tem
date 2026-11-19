'use client';

import { usePathname } from 'next/navigation';
import { useTenant } from '@/components/providers/TenantProvider';

/**
 * Caminho como o usuário vê (sem o segmento da cidade). O middleware reescreve
 * `/painel` para `/<cidade>/painel`, e no primeiro carregamento o `usePathname`
 * pode devolver a versão reescrita; aqui as duas viram `/painel`.
 */
export function useCaminho(): string {
  const p = usePathname();
  const { slug } = useTenant();
  if (p === `/${slug}`) return '/';
  return p.startsWith(`/${slug}/`) ? p.slice(slug.length + 1) : p;
}
