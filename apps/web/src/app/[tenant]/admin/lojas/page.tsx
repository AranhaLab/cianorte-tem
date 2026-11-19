import { LojasAdmin } from '@/components/admin/TelasCadastro';

export const metadata = { title: 'Lojas e filiais' };

export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return <LojasAdmin aba={typeof sp.aba === 'string' ? sp.aba : undefined} />;
}
