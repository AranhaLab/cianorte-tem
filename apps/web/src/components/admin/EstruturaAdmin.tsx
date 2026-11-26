'use client';

import type { ReactNode } from 'react';
import { useCaminho } from '@/hooks/useCaminho';
import { MenuAdmin } from './MenuAdmin';

/** Menu lateral + conteúdo; o editor da tela de acesso ocupa a tela toda, sem menu. */
export function EstruturaAdmin({ children }: { children: ReactNode }) {
  const caminho = useCaminho();
  if (caminho.startsWith('/admin/acesso/editor')) return <>{children}</>;
  return (
    <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-5 p-4">
      <MenuAdmin />
      <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-[18px]">{children}</main>
    </div>
  );
}
