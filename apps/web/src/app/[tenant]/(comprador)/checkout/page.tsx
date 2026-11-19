import { Checkout } from '@/components/compra/Checkout';
import { ExigeLogin } from '@/components/conta/ExigeLogin';

export const metadata = { title: 'Finalizar compra', robots: { index: false } };

/** Protótipo: vCheckout. Fechar a compra exige login; a sacola é mantida (CLAUDE.md §5.4). */
export default function PaginaCheckout() {
  return (
    <ExigeLogin next="checkout">
      <Checkout />
    </ExigeLogin>
  );
}
