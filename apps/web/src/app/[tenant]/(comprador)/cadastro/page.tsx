import { Cadastro } from '@/components/conta/Autenticacao';

export const metadata = { title: 'Criar conta', robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** O destino pós-login vem da URL (?next=checkout) e é lido no servidor. */
export default async function PaginaCadastro({ searchParams }: Props) {
  const next = (await searchParams).next;
  return <Cadastro next={typeof next === 'string' ? next : null} />;
}
