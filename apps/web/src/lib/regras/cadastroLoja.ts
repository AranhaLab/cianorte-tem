/**
 * Cadastro da loja (adesão do lojista, CLAUDE.md §7.1). O servidor repete tudo.
 * Etapas: empresa → responsável → unidade → recebimento → documentos → revisão e aceite.
 */
import { celularValido, cepValido, cpfValido, emailValido, soDigitos } from './cadastro';

export interface ArquivoEnviado {
  nome: string;
  tamanhoBytes: number;
}

export interface CadastroLoja {
  empresa: { cnpj: string; razao: string; fantasia: string; ie: string };
  responsavel: { nome: string; cpf: string; email: string; celular: string };
  unidade: { cep: string; rua: string; numero: string; bairro: string; horario: string };
  recebimento: { conectado: boolean; conta: string };
  documentos: {
    cartaoCnpj?: ArquivoEnviado;
    contratoSocial?: ArquivoEnviado;
    registroMarca?: ArquivoEnviado;
  };
  aceite: boolean;
  etapa: number; // última etapa aberta (retoma de onde parou)
}

export const ETAPAS = ['Empresa', 'Responsável', 'Unidade', 'Recebimento', 'Documentos', 'Revisão'] as const;

export const cadastroVazio = (): CadastroLoja => ({
  empresa: { cnpj: '', razao: '', fantasia: '', ie: '' },
  responsavel: { nome: '', cpf: '', email: '', celular: '' },
  unidade: { cep: '', rua: '', numero: '', bairro: '', horario: 'Seg a sáb, 8h às 18h' },
  recebimento: { conectado: false, conta: '' },
  documentos: {},
  aceite: false,
  etapa: 0,
});

/** CNPJ com os dois dígitos verificadores. */
export function cnpjValido(cnpj: string): boolean {
  const d = soDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((a, p, i) => a + Number(d[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** Máscaras enquanto digita. */
export const mascaraCnpj = (v: string) =>
  soDigitos(v)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
export const mascaraCpf = (v: string) =>
  soDigitos(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
export const mascaraCelular = (v: string) => {
  const d = soDigitos(v).slice(0, 11);
  return d.length <= 2
    ? d
    : d.length <= 7
      ? `(${d.slice(0, 2)}) ${d.slice(2)}`
      : `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};
export const mascaraCep = (v: string) =>
  soDigitos(v)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2');

/** Documentos: PDF, JPG ou PNG até 5 MB. */
export const LIMITE_DOCUMENTO = 5_000_000;
export function erroDocumento(f: { type: string; size: number }): string | null {
  if (!['application/pdf', 'image/jpeg', 'image/png'].includes(f.type)) return 'Envie PDF, JPG ou PNG.';
  if (f.size > LIMITE_DOCUMENTO) return 'O arquivo passa de 5 MB.';
  return null;
}

/** Erros de uma etapa (vazio = pode seguir). */
export function errosEtapa(etapa: number, c: CadastroLoja): Record<string, string> {
  const e: Record<string, string> = {};
  if (etapa === 0) {
    if (!cnpjValido(c.empresa.cnpj)) e.cnpj = 'CNPJ inválido. Confira os números.';
    if (c.empresa.razao.trim().length < 3) e.razao = 'Informe a razão social.';
    if (c.empresa.fantasia.trim().length < 2) e.fantasia = 'Informe o nome que aparece na vitrine.';
  }
  if (etapa === 1) {
    if (c.responsavel.nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!cpfValido(c.responsavel.cpf)) e.cpf = 'CPF inválido.';
    if (!emailValido(c.responsavel.email)) e.email = 'E-mail inválido.';
    if (!celularValido(c.responsavel.celular)) e.celular = 'Celular com DDD inválido.';
  }
  if (etapa === 2) {
    if (!cepValido(c.unidade.cep)) e.cep = 'CEP inválido.';
    if (!c.unidade.rua.trim()) e.rua = 'Informe a rua.';
    if (!c.unidade.numero.trim()) e.numero = 'Informe o número.';
    if (!c.unidade.bairro.trim()) e.bairro = 'Informe o bairro.';
  }
  if (etapa === 3 && !c.recebimento.conectado)
    e.recebimento = 'Conecte a conta de recebimento para continuar.';
  if (etapa === 4 && !c.documentos.cartaoCnpj) e.cartaoCnpj = 'O cartão CNPJ é obrigatório.';
  if (etapa === 5 && !c.aceite) e.aceite = 'Aceite o Contrato do Lojista para enviar.';
  return e;
}

/** Primeira etapa com pendência (para "Enviar" levar direto a ela). */
export const etapaPendente = (c: CadastroLoja) =>
  ETAPAS.findIndex((_, i) => Object.keys(errosEtapa(i, c)).length > 0);
