/**
 * Validações do cadastro do comprador (CLAUDE.md §6). O back-end repete todas.
 */

/** Versão dos Termos/Política aceita no cadastro (gravada no consentimento). */
export const VERSAO_TERMOS = '2026-11-18-provisoria';

export const soDigitos = (v: string) => v.replace(/\D/g, '');

/** CPF com dígitos verificadores válidos (rejeita sequências repetidas). */
export function cpfValido(cpf: string): boolean {
  const d = soDigitos(cpf);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (base: string, pesoInicial: number) => {
    const soma = [...base].reduce((a, n, i) => a + Number(n) * (pesoInicial - i), 0);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(d.slice(0, 9), 10) === Number(d[9]) && dv(d.slice(0, 10), 11) === Number(d[10]);
}

/** Mínimo de 8 caracteres, com letras e números (texto de ajuda do formulário). */
export const senhaValida = (s: string) => s.length >= 8 && /[A-Za-zÀ-ú]/.test(s) && /\d/.test(s);

export const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

/** Celular brasileiro com DDD: 10 ou 11 dígitos. */
export const celularValido = (c: string) => [10, 11].includes(soDigitos(c).length);

export const cepValido = (c: string) => soDigitos(c).length === 8;
export const formatarCep = (c: string) => {
  const d = soDigitos(c);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : c;
};
