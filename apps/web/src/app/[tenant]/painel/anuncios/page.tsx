import { CentralAnuncios } from '@/components/painel/CentralAnuncios';
import type { VagaId } from '@/types/domain';

export const metadata = { title: 'Anúncios' };

const VAGAS: VagaId[] = ['H1', 'M1', 'M2', 'C1', 'K1', 'L1'];

/** /painel/anuncios?vaga=K1 abre direto na vaga (link do convite da categoria). */
export default async function Pagina({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const v = (await searchParams).vaga;
  return <CentralAnuncios vagaInicial={VAGAS.find((x) => x === v)} />;
}
