/**
 * Regras do editor de produto do lojista (CLAUDE.md §7.3, §5.3, §13.8 e §16).
 * O servidor repete todas; o front só evita o envio de um cadastro inválido.
 */
import { kitValido, MAX_MIDIAS } from './kits';
import type { ArquivoDigital, Centavos, Kit, Midia, Produto } from '@/types/domain';

export type TipoProduto = 'simples' | 'variacoes' | 'kit' | 'digital';

export interface OpcaoRascunho {
  nome: string;
  sku: string;
  saldo: number;
}

/** Produto como o lojista edita (inclui o que o comprador não vê: SKU, saldo, mínimo). */
export interface RascunhoProduto {
  id: string | null; // null = produto novo
  nome: string;
  descricao: string;
  categoriaId: string;
  subcategoriaId: string | null;
  marca: string;
  caracteristicas: string[];
  tipo: TipoProduto;
  precoCentavos: Centavos;
  precoDeCentavos: Centavos | null;
  sku: string;
  gtin: string;
  saldo: number;
  minimo: number;
  variacao: { nome: string; opcoes: OpcaoRascunho[] } | null;
  kit: Kit | null;
  digital: (Pick<ArquivoDigital, 'formato' | 'tamanhoBytes'> & { nomeArquivo: string }) | null;
  midias: Array<Midia & { nomeArquivo?: string }>;
}

/** Campos que vão para a moderação ao mudar (§7.3). [PROPOSTA] variação, kit e arquivo também. */
export const CAMPOS_EDITORIAIS = [
  'nome',
  'descricao',
  'categoriaId',
  'subcategoriaId',
  'marca',
  'caracteristicas',
  'midias',
  'variacao',
  'kit',
  'digital',
] as const;
/** Campos que valem na hora, sem moderação (§7.3). */
export const CAMPOS_IMEDIATOS = ['precoCentavos', 'precoDeCentavos', 'saldo', 'minimo'] as const;

const ROTULO: Record<string, string> = {
  nome: 'nome',
  descricao: 'descrição',
  categoriaId: 'categoria',
  subcategoriaId: 'subcategoria',
  marca: 'marca',
  caracteristicas: 'características',
  midias: 'fotos e vídeo',
  variacao: 'variações',
  kit: 'composição do kit',
  digital: 'arquivo digital',
  precoCentavos: 'preço',
  precoDeCentavos: 'preço "de"',
  saldo: 'estoque',
  minimo: 'estoque mínimo',
};
export const rotuloCampo = (c: string) => ROTULO[c] ?? c;

/** Separa o que mudou entre o que precisa de aprovação e o que vale na hora. */
export function separarAlteracoes(antes: RascunhoProduto, depois: RascunhoProduto) {
  // O saldo de cada opção é estoque (imediato); nome e SKU das opções são conteúdo.
  const semSaldo = (v: RascunhoProduto['variacao']) =>
    v && { nome: v.nome, opcoes: v.opcoes.map(({ nome, sku }) => ({ nome, sku })) };
  const valor = (r: RascunhoProduto, c: keyof RascunhoProduto) =>
    JSON.stringify(c === 'variacao' ? semSaldo(r.variacao) : c === 'saldo' ? saldosPorOpcao(r) : r[c]);
  const mudou = (c: keyof RascunhoProduto) => valor(antes, c) !== valor(depois, c);
  return {
    editoriais: CAMPOS_EDITORIAIS.filter(mudou),
    imediatas: CAMPOS_IMEDIATOS.filter(mudou),
  };
}

const saldosPorOpcao = (r: RascunhoProduto) =>
  r.tipo === 'variacoes' && r.variacao ? r.variacao.opcoes.map((o) => [o.nome, o.saldo]) : r.saldo;

/** GTIN/EAN (8, 12, 13 ou 14 dígitos) com dígito verificador módulo 10. */
export function gtinValido(codigo: string): boolean {
  const d = codigo.replace(/\s/g, '');
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(d)) return false;
  const nums = [...d].map(Number);
  const verificador = nums.pop()!;
  const soma = nums.reverse().reduce((a, n, i) => a + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (soma % 10)) % 10 === verificador;
}

const SKU = /^[A-Za-z0-9._-]{1,40}$/;

/**
 * Erros do cadastro, por campo. Vazio = pode enviar.
 * `skusDaLoja`: SKUs já usados por OUTROS produtos da loja (SKU é único por loja, §8).
 */
export function errosProduto(
  r: RascunhoProduto,
  ctx: { lojaId: string; produtosDaLoja: Pick<Produto, 'id' | 'lojaId'>[]; skusDaLoja: string[] },
): Record<string, string> {
  const e: Record<string, string> = {};
  const nome = r.nome.trim();
  if (nome.length < 3 || nome.length > 120) e.nome = 'Use de 3 a 120 caracteres.';
  if (!r.categoriaId) e.categoriaId = 'Escolha a categoria.';
  if (!(r.precoCentavos > 0)) e.precoCentavos = 'Informe um preço maior que zero.';
  if (r.precoDeCentavos !== null && !(r.precoDeCentavos > r.precoCentavos))
    e.precoDeCentavos = 'O preço "de" precisa ser maior que o preço de venda.';
  if (r.gtin.trim() && !gtinValido(r.gtin)) e.gtin = 'Código de barras inválido (confira os dígitos).';
  if (!r.midias.length) e.midias = 'Envie pelo menos uma foto.';
  else if (r.midias.length > MAX_MIDIAS) e.midias = `No máximo ${MAX_MIDIAS} fotos e vídeos.`;
  else if (!r.midias.some((m) => m.tipo === 'imagem')) e.midias = 'Inclua pelo menos uma foto além do vídeo.';
  else if (r.midias.some((m) => !m.legenda.trim()))
    e.midias = 'Descreva cada foto (texto para leitores de tela).';

  const usados = new Set(ctx.skusDaLoja.map((s) => s.toUpperCase()));
  const conferirSku = (sku: string, campo: string) => {
    if (!SKU.test(sku)) e[campo] = 'Use até 40 letras, números, ponto, hífen ou sublinhado.';
    else if (usados.has(sku.toUpperCase())) e[campo] = 'Este SKU já é usado em outro produto da loja.';
    else usados.add(sku.toUpperCase());
  };

  if (r.tipo === 'variacoes') {
    const v = r.variacao;
    if (!v || !v.nome.trim()) e.variacao = 'Dê um nome à variação (ex.: Tamanho).';
    else if (v.opcoes.length < 2) e.variacao = 'Cadastre pelo menos 2 opções.';
    else if (new Set(v.opcoes.map((o) => o.nome.trim().toLowerCase())).size !== v.opcoes.length)
      e.variacao = 'As opções precisam ter nomes diferentes.';
    else if (v.opcoes.some((o) => !o.nome.trim())) e.variacao = 'Preencha o nome de cada opção.';
    else v.opcoes.forEach((o, i) => conferirSku(o.sku, `opcao-${i}`));
  } else if (r.tipo === 'kit') {
    if (!r.kit || !kitValido(r.kit, ctx.lojaId, ctx.produtosDaLoja))
      e.kit =
        r.kit?.tipo === 'aberto'
          ? 'Escolha pelo menos 2 produtos da loja e um mínimo de 2 itens (máximo ≥ mínimo).'
          : 'Escolha pelo menos 2 produtos diferentes da sua loja.';
    else if (r.kit.tipo === 'aberto' && r.kit.maximoItens > r.kit.componentes.length)
      e.kit = 'O máximo de itens não pode passar do número de opções.';
    else if (r.kit.tipo === 'aberto' && !(r.kit.descontoPercentual >= 0 && r.kit.descontoPercentual <= 50))
      e.kit = 'Desconto do kit entre 0% e 50%.';
  } else {
    conferirSku(r.sku, 'sku');
    if (r.tipo === 'digital' && !r.digital) e.digital = 'Envie o arquivo (PDF, EPUB ou ZIP).';
  }
  if (r.tipo !== 'digital' && r.tipo !== 'kit' && (r.saldo < 0 || r.minimo < 0))
    e.saldo = 'Estoque não pode ser negativo.';
  return e;
}

/* ---------- Mídias ---------- */
export const LIMITE_FOTO = 10_000_000; // [PROPOSTA] 10 MB
export const LIMITE_VIDEO = 50_000_000; // [PROPOSTA] 50 MB
export const LIMITE_DIGITAL = 200_000_000; // [PROPOSTA] 200 MB
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
const TIPOS_VIDEO = ['video/mp4', 'video/webm'];

/** Valida um arquivo da galeria. Retorna o tipo de mídia ou a mensagem de erro. */
export function classificarMidia(f: {
  type: string;
  size: number;
}): { tipo: Midia['tipo'] } | { erro: string } {
  if (TIPOS_FOTO.includes(f.type))
    return f.size > LIMITE_FOTO ? { erro: 'Foto acima de 10 MB.' } : { tipo: 'imagem' };
  if (TIPOS_VIDEO.includes(f.type))
    return f.size > LIMITE_VIDEO ? { erro: 'Vídeo acima de 50 MB.' } : { tipo: 'video' };
  return { erro: 'Envie fotos JPG, PNG ou WebP, ou vídeo MP4 ou WebM.' };
}

/** Arquivo de produto digital: PDF, EPUB ou ZIP até 200 MB. */
export function formatoDigital(f: {
  name: string;
  size: number;
}): ArquivoDigital['formato'] | { erro: string } {
  const ext = f.name.split('.').pop()?.toUpperCase();
  if (ext !== 'PDF' && ext !== 'EPUB' && ext !== 'ZIP')
    return { erro: 'O arquivo precisa ser PDF, EPUB ou ZIP.' };
  if (f.size > LIMITE_DIGITAL) return { erro: 'Arquivo acima de 200 MB.' };
  return ext;
}

/** Move um item da lista (ordem da galeria). Fora dos limites, devolve a lista igual. */
export function mover<T>(lista: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= lista.length) return lista;
  const n = [...lista];
  [n[i], n[j]] = [n[j]!, n[i]!];
  return n;
}

/** Posição do preço frente às ofertas equivalentes (mesmo GTIN) — só informativo (§16). */
export function posicaoPreco(preco: Centavos, [min, max]: [Centavos, Centavos]) {
  return preco < min ? 'abaixo' : preco > max ? 'acima' : 'dentro da faixa';
}

/* ---------- Publicação e moderação ---------- */
/** Copia preço e estoque de `de` para `para` (inclusive o saldo das opções com o mesmo nome). */
function comImediatos(para: RascunhoProduto, de: RascunhoProduto): RascunhoProduto {
  const r: RascunhoProduto = { ...para };
  for (const c of CAMPOS_IMEDIATOS) (r as unknown as Record<string, unknown>)[c] = de[c];
  if (r.variacao && de.variacao)
    r.variacao = {
      ...r.variacao,
      opcoes: r.variacao.opcoes.map((o) => ({
        ...o,
        saldo: de.variacao!.opcoes.find((x) => x.nome === o.nome)?.saldo ?? o.saldo,
      })),
    };
  return r;
}

/**
 * Salvar uma edição: preço e estoque valem na hora na versão publicada; o resto
 * fica em análise. Se o conteúdo voltar a ser igual ao publicado, a análise é cancelada.
 */
export function aplicarEdicao(publicado: RascunhoProduto, rascunho: RascunhoProduto) {
  const { editoriais, imediatas } = separarAlteracoes(publicado, rascunho);
  return {
    editoriais,
    imediatas,
    atual: comImediatos(publicado, rascunho),
    emAnalise: editoriais.length ? rascunho : null,
  };
}

/** Aprovar o conteúdo NÃO restaura preço nem estoque antigos (§7.3): ficam os atuais. */
export const aplicarAprovacao = (atual: RascunhoProduto, emAnalise: RascunhoProduto): RascunhoProduto =>
  comImediatos(emAnalise, atual);

/** Converte o produto do catálogo (+ estoque do painel) no formato do editor. */
export function rascunhoDeProduto(
  p: Produto,
  est?: { sku: string; saldo: number; minimo: number },
): RascunhoProduto {
  const sku = est?.sku ?? p.id.toUpperCase();
  const saldo = est?.saldo ?? 0;
  const n = p.variacao?.opcoes.length ?? 1;
  return {
    id: p.id,
    nome: p.nome,
    descricao: '',
    categoriaId: p.categoriaId,
    subcategoriaId: p.subcategoriaId,
    marca: p.marca ?? '',
    caracteristicas: [...p.caracteristicas],
    tipo: p.kit ? 'kit' : p.digital ? 'digital' : p.variacao ? 'variacoes' : 'simples',
    precoCentavos: p.precoCentavos,
    precoDeCentavos: p.precoDeCentavos,
    sku,
    gtin: '',
    saldo,
    minimo: est?.minimo ?? 0,
    variacao: p.variacao
      ? {
          nome: p.variacao.nome,
          opcoes: p.variacao.opcoes.map((o, i) => ({
            nome: o,
            sku: `${sku}-${o}`.replace(/[^A-Za-z0-9._-]/g, ''),
            saldo: Math.floor(saldo / n) + (i < saldo % n ? 1 : 0),
          })),
        }
      : null,
    kit: p.kit ? structuredClone(p.kit) : null,
    digital: p.digital
      ? {
          formato: p.digital.formato,
          tamanhoBytes: p.digital.tamanhoBytes,
          nomeArquivo: `${p.id}.${p.digital.formato.toLowerCase()}`,
        }
      : null,
    midias: p.midias.map((m) => ({ ...m })),
  };
}

/** Saldo total do rascunho (variações somam as opções; kit e digital não têm estoque próprio). */
export const saldoTotal = (r: RascunhoProduto) =>
  r.tipo === 'variacoes' && r.variacao ? r.variacao.opcoes.reduce((a, o) => a + o.saldo, 0) : r.saldo;
