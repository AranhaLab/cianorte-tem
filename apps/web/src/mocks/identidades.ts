/**
 * Identidades visuais (CLAUDE.md §2 e §13.20): nome do sistema, logo e paleta.
 *
 * - "cianorte-tem": identidade aprovada pela cidade (azul-marinho + etiqueta "Tem").
 *   Fica guardada para o lançamento em Cianorte; é também a paleta padrão do CSS.
 * - "mkt-local": marca genérica para apresentar a investidores e sócios sem o nome
 *   da cidade (chumbo + etiqueta vermelha "Local").
 *
 * Cada cidade escolhe a identidade em `mocks/tenants.ts`. No back-end, isto vem com
 * GET /v1/tenant. Hex é dado (paleta da marca), por isso fica em src/mocks.
 */

/** Cores da marca que mudam por identidade (o resto dos tokens é igual em todas). */
export interface Paleta {
  marinho: string; // cabeçalho, rodapé, títulos, item ativo
  'marinho-2': string;
  'marinho-profundo': string;
  azul: string; // ação: botões, links, foco
  'azul-escuro': string;
  'azul-claro': string; // texto de apoio sobre o fundo escuro
  'azul-borda': string;
  'azul-nevoa': string; // fundos de apoio
  linho: string; // fundo da página
  borda: string;
  'borda-fria': string;
  'sobre-marinho': string; // textos sobre o fundo escuro
  'sobre-marinho-forte': string;
  'sobre-marinho-claro': string;
  'sobre-marinho-suave': string;
  'neutro-50': string;
  'neutro-100': string;
  'neutro-150': string;
  'neutro-200': string;
  'neutro-300': string;
  'neutro-400': string;
  'neutro-500': string;
  'neutro-700': string;
}

export interface Identidade {
  id: string;
  /** Nome do sistema (título das páginas, PWA, textos "no <marca>"). */
  marca: string;
  /** Logo: texto + etiqueta de roupa com pesponto. */
  logo: { nome: string; etiqueta: string };
  /** Cor da etiqueta, ofertas e alertas. */
  acento: string;
  paleta: Paleta;
}

const CIANORTE_TEM: Identidade = {
  id: 'cianorte-tem',
  marca: 'Cianorte Tem',
  logo: { nome: 'Cianorte', etiqueta: 'Tem' },
  acento: '#D7263D',
  paleta: {
    marinho: '#14213D',
    'marinho-2': '#1C2C50',
    'marinho-profundo': '#0F1830',
    azul: '#1F4FA3',
    'azul-escuro': '#173E82',
    'azul-claro': '#8FB0EA',
    'azul-borda': '#CDD6EA',
    'azul-nevoa': '#EEF2FA',
    linho: '#F7F6F2',
    borda: '#E3E1DA',
    'borda-fria': '#DCE1EC',
    'sobre-marinho': '#C9D3EA',
    'sobre-marinho-forte': '#DCE3F2',
    'sobre-marinho-claro': '#E6EBF5',
    'sobre-marinho-suave': '#AEBBD6',
    'neutro-50': '#FAFBFD',
    'neutro-100': '#F6F7FA',
    'neutro-150': '#F1F3F8',
    'neutro-200': '#EEF0F5',
    'neutro-300': '#E3E7EF',
    'neutro-400': '#CDD3DF',
    'neutro-500': '#A3AABA',
    'neutro-700': '#333B4D',
  },
};

/** [DECIDIDO pelo PO 27/11/2026] Opção A: chumbo no lugar do azul, vermelho só na etiqueta e nas ofertas. */
const MKT_LOCAL: Identidade = {
  id: 'mkt-local',
  marca: 'MKT Local',
  logo: { nome: 'MKT', etiqueta: 'Local' },
  acento: '#C8102E',
  paleta: {
    marinho: '#1E2125',
    'marinho-2': '#2B2F36',
    'marinho-profundo': '#141619',
    azul: '#2B2F36',
    'azul-escuro': '#1A1D21',
    'azul-claro': '#C5CAD2',
    'azul-borda': '#D6D9DE',
    'azul-nevoa': '#EFF0F2',
    linho: '#F4F4F5',
    borda: '#E2E3E5',
    'borda-fria': '#DADDE1',
    'sobre-marinho': '#C9CCD2',
    'sobre-marinho-forte': '#DDE0E4',
    'sobre-marinho-claro': '#E8EAED',
    'sobre-marinho-suave': '#AEB3BB',
    'neutro-50': '#FAFAFA',
    'neutro-100': '#F6F6F7',
    'neutro-150': '#F1F1F3',
    'neutro-200': '#EDEEF0',
    'neutro-300': '#E2E4E7',
    'neutro-400': '#CBCED3',
    'neutro-500': '#A2A6AD',
    'neutro-700': '#34383F',
  },
};

export const IDENTIDADES: Record<string, Identidade> = {
  [CIANORTE_TEM.id]: CIANORTE_TEM,
  [MKT_LOCAL.id]: MKT_LOCAL,
};

/** Paleta padrão do CSS (tailwind.config.ts): a de Cianorte, aprovada pela cidade. */
export const PALETA_PADRAO = CIANORTE_TEM.paleta;
