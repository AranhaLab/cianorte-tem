import type { Produto } from '@/types/domain';

export const normalizarAtributo = (s: string) =>
  s
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export const chaveAtributo = (nome: string, valor: string) =>
  JSON.stringify([normalizarAtributo(nome), normalizarAtributo(valor)]);
export function lerChaveAtributo(chave: string): [string, string] | null {
  try {
    const p: unknown = JSON.parse(chave);
    return Array.isArray(p) &&
      p.length === 2 &&
      p.every((v) => typeof v === 'string' && v.length > 0 && v.length <= 100)
      ? [normalizarAtributo(p[0]), normalizarAtributo(p[1])]
      : null;
  } catch {
    return null;
  }
}

export function atributosDoProduto(p: Produto) {
  return [
    ...(p.atributos ?? []),
    ...(p.variacao ? p.variacao.opcoes.map((valor) => ({ nome: p.variacao!.nome, valor })) : []),
  ].filter((a) => a.nome.trim() && a.valor.trim());
}

export function possuiAtributos(p: Produto, selecionados: string[] = []) {
  const grupos = new Map<string, Set<string>>();
  for (const chave of selecionados) {
    const par = lerChaveAtributo(chave);
    if (!par) continue;
    if (!grupos.has(par[0])) grupos.set(par[0], new Set());
    grupos.get(par[0])!.add(par[1]);
  }
  const atributos = atributosDoProduto(p);
  return [...grupos].every(([nome, valores]) =>
    atributos.some((a) => normalizarAtributo(a.nome) === nome && valores.has(normalizarAtributo(a.valor))),
  );
}

export interface GrupoAtributo {
  nome: string;
  opcoes: Array<{ valor: string; rotulo: string; total: number }>;
}
export function agruparAtributos(produtos: Produto[]): GrupoAtributo[] {
  const grupos = new Map<
    string,
    { nome: string; opcoes: Map<string, { rotulo: string; produtos: Set<string> }> }
  >();
  for (const p of produtos)
    for (const a of atributosDoProduto(p)) {
      const nome = normalizarAtributo(a.nome),
        valor = normalizarAtributo(a.valor);
      if (!grupos.has(nome)) grupos.set(nome, { nome: a.nome.trim(), opcoes: new Map() });
      const grupo = grupos.get(nome)!;
      if (!grupo.opcoes.has(valor)) grupo.opcoes.set(valor, { rotulo: a.valor.trim(), produtos: new Set() });
      grupo.opcoes.get(valor)!.produtos.add(p.id);
    }
  return [...grupos]
    .map(([nome, g]) => ({
      nome: g.nome,
      opcoes: [...g.opcoes]
        .map(([valor, item]) => ({
          valor: JSON.stringify([nome, valor]),
          rotulo: item.rotulo,
          total: item.produtos.size,
        }))
        .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR')),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
