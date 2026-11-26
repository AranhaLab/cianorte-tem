import { EditorAcesso } from '@/components/admin/EditorAcesso';
import type { TelaAcesso } from '@/stores/acessoVisual';

export const metadata = { title: 'Editor da tela de acesso' };

const TELAS: TelaAcesso[] = ['entrar', 'cadastro', 'lojista-entrar', 'lojista-cadastro'];

export default async function Page({ searchParams }: { searchParams: Promise<{ tela?: string }> }) {
  const { tela } = await searchParams;
  return <EditorAcesso telaInicial={TELAS.includes(tela as TelaAcesso) ? (tela as TelaAcesso) : 'entrar'} />;
}
