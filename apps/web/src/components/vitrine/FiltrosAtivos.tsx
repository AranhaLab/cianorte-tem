import Link from 'next/link';
import { Icone } from '@/components/ui/Icone';
import type { Facetas, FiltrosLaterais } from '@/lib/api';
import { urlFiltros } from '@/lib/filtros';
import { reais } from '@/lib/regras/dinheiro';
import { lerChaveAtributo } from '@/lib/regras/atributos';
import type { Subcategoria } from '@/types/domain';

/** Chips de subcategoria (Todas · Camisaria · Calças…) — links, funcionam sem JavaScript. */
export function ChipsSubcategoria({
  base,
  subs,
  atual,
  manter,
}: {
  base: string;
  subs: Subcategoria[];
  atual?: string;
  manter: { ord?: string; f?: string };
}) {
  if (!subs.length) return null;
  const chip = (rotulo: string, sub: string | undefined) => (
    <Link
      key={rotulo}
      href={urlFiltros(base, { ...manter, sub })}
      scroll={false}
      aria-current={atual === sub ? 'true' : undefined}
      className={`chip min-h-toque ${atual === sub ? 'chip-on' : ''}`}
    >
      {rotulo}
    </Link>
  );
  return (
    <nav aria-label="Subcategorias" className="sem-barra flex gap-2 overflow-x-auto pb-1">
      {chip('Todas', undefined)}
      {subs.map((s) => chip(s.nome, s.id))}
    </nav>
  );
}

/** Filtros laterais em uso, cada um com um "×" que remove só ele. */
export function FiltrosAtivos({
  base,
  atuais,
  facetas,
  manter,
}: {
  base: string;
  atuais: FiltrosLaterais;
  facetas: Facetas;
  manter: { ord?: string; f?: string; q?: string };
}) {
  const sem = (mudar: Partial<FiltrosLaterais>) => urlFiltros(base, { ...manter, ...atuais, ...mudar });
  const itens: Array<[string, string]> = [
    ...(atuais.marcas ?? []).map((m): [string, string] => [
      m,
      sem({ marcas: atuais.marcas!.filter((x) => x !== m) }),
    ]),
    ...(atuais.lojas ?? []).map((l): [string, string] => [
      facetas.lojas.find((x) => x.valor === l)?.rotulo ?? l,
      sem({ lojas: atuais.lojas!.filter((x) => x !== l) }),
    ]),
    ...(atuais.caracteristicas ?? []).map((c): [string, string] => [
      c,
      sem({ caracteristicas: atuais.caracteristicas!.filter((x) => x !== c) }),
    ]),
    ...(atuais.atributos ?? []).map((chave): [string, string] => {
      const grupo = facetas.atributos?.find((g) => g.opcoes.some((o) => o.valor === chave));
      const opcao = grupo?.opcoes.find((o) => o.valor === chave);
      const partes = lerChaveAtributo(chave);
      return [`${grupo?.nome ?? partes?.[0] ?? 'Atributo'}: ${opcao?.rotulo ?? partes?.[1] ?? ''}`, sem({ atributos: atuais.atributos!.filter((x) => x !== chave) })];
    }),
    ...(atuais.precoMin !== undefined
      ? [[`a partir de ${reais(atuais.precoMin)}`, sem({ precoMin: undefined })] as [string, string]]
      : []),
    ...(atuais.precoMax !== undefined
      ? [[`até ${reais(atuais.precoMax)}`, sem({ precoMax: undefined })] as [string, string]]
      : []),
  ];
  if (!itens.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Filtros aplicados">
      {itens.map(([rotulo, href]) => (
        <Link
          key={rotulo}
          href={href}
          scroll={false}
          aria-label={`${rotulo} — remover filtro`}
          className="inline-flex min-h-toque items-center gap-1.5 rounded-full bg-azul-nevoa px-3 text-[13px] font-semibold text-azul-escuro hover:bg-azul-borda/50 hover:text-azul-escuro"
        >
          {rotulo}
          <Icone nome="x" tamanho="sm" />
        </Link>
      ))}
      <Link
        href={urlFiltros(base, { ...manter, sub: atuais.sub })}
        scroll={false}
        className="inline-flex min-h-toque items-center text-[13px] font-semibold underline"
      >
        Limpar tudo
      </Link>
    </div>
  );
}
