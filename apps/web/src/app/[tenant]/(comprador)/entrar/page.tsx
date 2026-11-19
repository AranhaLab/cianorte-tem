import { Entrar } from '@/components/conta/Autenticacao';

export const metadata = { title: 'Entrar', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** O destino pós-login vem da URL (?next=checkout) e é lido no servidor. */
export default async function PaginaEntrar({ searchParams }: Props) {
  const next = (await searchParams).next;
  return <Entrar next={typeof next === 'string' ? next : null} />;
}
