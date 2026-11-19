/**
 * Arte do anúncio (CLAUDE.md §9.1 e §9.3). O servidor repete todas as checagens.
 * - A arte só pode ser enviada DEPOIS da compra (lance vencido ou compra direta paga),
 *   e fica vinculada à loja que comprou.
 * - Arquivo JPG, PNG ou WebP até 500 KB; resolução suficiente para a vaga.
 * - O lojista ajusta zoom e posição numa simulação da vaga e escolhe o efeito.
 * - Todo anúncio mostra "Patrocinado" + nome e logo da loja (não é editável).
 */
import type { ArteAnuncio, CriativoAnuncio, StatusCampanha, VagaAnuncio } from '@/types/domain';

export const LIMITE_ARTE = 500_000; // 500 KB (§9.1)
export const TIPOS_ARTE = ['image/jpeg', 'image/png', 'image/webp'];
export const LIMITE_TITULO = 40;
export const LIMITE_SUB = 70;
export const LIMITE_ALT = 120;
export const CTAS = ['Ver ofertas', 'Comprar agora', 'Conhecer', 'Ver coleção', 'Saiba mais'];

export const ROTULO_CAMPANHA: Record<StatusCampanha, [string, string]> = {
  lance_ativo: ['Lance vencendo', 'st-amber'],
  lance_superado: ['Lance superado', 'st-red'],
  aguardando_arte: ['Aguardando arte', 'st-blue'],
  arte_em_analise: ['Arte em análise', 'st-amber'],
  no_ar: ['No ar', 'st-green'],
  encerrada: ['Encerrada', 'st-gray'],
  reprovada: ['Arte reprovada', 'st-red'],
};

/** A arte só pode ser enviada (ou reenviada) com o espaço já garantido para a loja. */
export const podeEnviarArte = (s: StatusCampanha) => s === 'aguardando_arte' || s === 'reprovada';

/** "1200 × 400 px" → { w: 1200, h: 400 }. "2 × 580 × 240 px" (dupla) → cada peça, 580 × 240. */
export function medidas(formato: string): { w: number; h: number } {
  const n = [...formato.matchAll(/\d+/g)].map((m) => Number(m[0]));
  return n.length >= 3 ? { w: n[1]!, h: n[2]! } : { w: n[0] ?? 0, h: n[1] ?? 0 };
}

export function erroArquivoArte(f: { type: string; size: number }): string | null {
  if (!TIPOS_ARTE.includes(f.type)) return 'Envie a arte em JPG, PNG ou WebP.';
  if (f.size > LIMITE_ARTE) return 'A arte passa de 500 KB. Exporte com mais compressão (WebP ajuda).';
  return null;
}

/**
 * Qualidade da imagem na vaga: quanto ela precisa ser AMPLIADA para cobrir o espaço
 * (considerando o zoom). Até 1× é nítida; até 1,3× é aceitável; acima disso fica borrada.
 * [PROPOSTA] Acima de 1,3× o envio é bloqueado.
 */
export function qualidadeArte(
  img: { largura: number; altura: number },
  vaga: { w: number; h: number },
  zoom = 1,
): { ampliacao: number; nivel: 'boa' | 'aceitavel' | 'baixa' } {
  const cobrir = Math.max(vaga.w / img.largura, vaga.h / img.altura);
  const ampliacao = Math.round(cobrir * zoom * 100) / 100;
  return { ampliacao, nivel: ampliacao <= 1 ? 'boa' : ampliacao <= 1.3 ? 'aceitavel' : 'baixa' };
}

/** Erros da arte antes de enviar para a moderação. Vazio = pode enviar. */
export function errosArte(a: ArteAnuncio, vaga: Pick<VagaAnuncio, 'formato'>): Record<string, string> {
  const e: Record<string, string> = {};
  const q = qualidadeArte(a.imagem, medidas(vaga.formato.desktop), a.enquadramento.zoom);
  if (q.nivel === 'baixa')
    e.imagem = `A imagem fica ampliada ${q.ampliacao.toFixed(2).replace('.', ',')}× e vai perder nitidez. Use uma imagem maior ou diminua o zoom.`;
  if (a.modo === 'montar') {
    if (!a.titulo.trim()) e.titulo = 'Escreva o título.';
    else if (a.titulo.length > LIMITE_TITULO) e.titulo = `Até ${LIMITE_TITULO} caracteres.`;
    if (a.sub.length > LIMITE_SUB) e.sub = `Até ${LIMITE_SUB} caracteres.`;
    if (a.efeito === 'nenhum')
      e.efeito = 'Com texto sobre a foto, escolha degradê ou faixa para manter a leitura.';
  } else if (a.titulo.trim().length < 5) e.titulo = 'Descreva o que a arte diz (texto alternativo).';
  if (!/^#[0-9a-f]{6}$/i.test(a.cor)) e.cor = 'Cor inválida.';
  return e;
}

/** Monta o criativo público a partir da arte (o mesmo componente da vitrine desenha a prévia). */
export function criativoDaArte(
  a: ArteAnuncio,
  vaga: CriativoAnuncio['vaga'],
  loja: { nome: string; cor: string; id?: string; logo?: string },
): CriativoAnuncio {
  const claro = luminancia(a.cor) > 0.6;
  return {
    vaga,
    titulo: a.titulo,
    sub: a.sub,
    cta: a.cta,
    fundo: a.cor,
    // A cor integra os dados do criativo, junto à cor escolhida pelo anunciante.
    // eslint-disable-next-line no-restricted-syntax
    texto: claro ? '#14213D' : '#FFFFFF',
    href: a.destino,
    anunciante: loja.nome,
    imagem: a.imagem.dados,
    marca: {
      nome: loja.nome,
      cor: loja.cor,
      ...(loja.id ? { lojaId: loja.id } : {}),
      ...(loja.logo ? { logo: loja.logo } : {}),
    },
    modo: a.modo,
    efeito: a.efeito,
    enquadramento: a.enquadramento,
  };
}

/** Luminância relativa (0 a 1) de '#RRGGBB' — escolhe texto claro ou escuro sobre a cor da marca. */
export function luminancia(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** Sigla da marca quando não há logo: "Confecções Vale Azul" → "CV". */
export const sigla = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => p.length > 2 || /^[A-Z]/.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
