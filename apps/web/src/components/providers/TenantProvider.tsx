'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tenant } from '@/types/domain';

/** Disponibiliza a cidade (resolvida no servidor) para componentes de cliente. */
const Ctx = createContext<Tenant | null>(null);

export function TenantProvider({ tenant, children }: { tenant: Tenant; children: ReactNode }) {
  return <Ctx.Provider value={tenant}>{children}</Ctx.Provider>;
}

export function useTenant(): Tenant {
  const t = useContext(Ctx);
  if (!t) throw new Error('useTenant fora do TenantProvider');
  return t;
}
