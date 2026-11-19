import type { ReactNode } from 'react';

/** Grade de produtos: 2 colunas no celular → 5 no desktop largo (protótipo: grid-products). */
export function GradeProdutos({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 xl:gap-4 3xl:grid-cols-5">
      {children}
    </div>
  );
}
