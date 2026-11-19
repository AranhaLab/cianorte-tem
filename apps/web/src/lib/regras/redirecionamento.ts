/**
 * Para onde voltar depois de entrar ou criar conta (CLAUDE.md §13.6.1).
 * Volta para a tela de onde a pessoa saiu, mas só para caminhos DESTE site:
 * nada de "//outro.site", "https://…", "\\" ou "javascript:" (evita redirecionamento aberto).
 */
const TELAS_DE_ACESSO = /^\/(entrar|cadastro|lojista\/entrar)(\/|\?|$)/;

export function destinoSeguro(next: string | null | undefined, padrao = '/'): string {
  if (!next) return padrao;
  if (next === 'checkout') return '/checkout'; // forma antiga, ainda aceita
  if (next.length > 300) return padrao;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return padrao;
  if (/[\u0000-\u001f]/.test(next)) return padrao;
  if (TELAS_DE_ACESSO.test(next)) return padrao; // não volta para o próprio login
  return next;
}

/** Monta o link de login guardando a tela atual. */
export const linkEntrar = (atual: string, base = '/entrar') =>
  atual && atual !== '/' && !TELAS_DE_ACESSO.test(atual) ? `${base}?next=${encodeURIComponent(atual)}` : base;
