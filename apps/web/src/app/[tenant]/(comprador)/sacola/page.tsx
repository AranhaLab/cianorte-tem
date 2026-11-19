import { Sacola } from '@/components/compra/Sacola';

export const metadata = { title: 'Sacola', robots: { index: false } };

/** Protótipo: vSacola. Conteúdo depende do aparelho do comprador (cliente). */
export default function PaginaSacola() {
  return <Sacola />;
}
