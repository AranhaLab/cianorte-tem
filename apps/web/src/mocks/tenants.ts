import type { Tenant } from '@/types/domain';
import { IDENTIDADES } from './identidades';

/**
 * Identidade visual de cada cidade. [DECIDIDO pelo PO 27/11/2026] Cianorte se
 * apresenta como "MKT Local" (marca genérica para investidores e sócios). Para o
 * lançamento na cidade, troque para 'cianorte-tem': a identidade aprovada continua
 * guardada em identidades.ts. Produtos, lojas e textos da cidade não mudam.
 */
const IDENTIDADE_CIANORTE = IDENTIDADES['mkt-local']!;

/**
 * Registro de cidades (mock de GET /v1/tenant).
 * No back-end isto é a tabela Tenant, resolvida pelo host da requisição.
 * Os textos entre [colchetes] são pendências (CLAUDE.md §12).
 */
export const TENANTS: Record<string, Tenant> = {
  cianorte: {
    slug: 'cianorte',
    nome: 'Cianorte',
    identidade: IDENTIDADE_CIANORTE.id,
    marca: IDENTIDADE_CIANORTE.marca,
    logo: IDENTIDADE_CIANORTE.logo,
    paleta: { ...IDENTIDADE_CIANORTE.paleta },
    uf: 'PR',
    cepPadrao: '87200-000',
    acento: IDENTIDADE_CIANORTE.acento,
    associacao: 'ACIC',
    slogan: 'Tudo o que a cidade tem, num lugar só.',
    fundoAcesso: {
      src: '/acesso/vitrine-cianorte-tem.webp',
      legenda: 'O Cianorte Tem no computador e no celular',
    },
    cepsAtendidos: ['87200', '87201', '87202', '87203', '87204', '87205', '87206', '87207', '87208', '87209'],
    dominios: ['cianorte.localhost', 'cianortetem.com.br', 'www.cianortetem.com.br'],
    razaoSocialOperadora: '[Razão social da operadora]',
    cnpjOperadora: '[00.000.000/0000-00]',
    enderecoOperadora: '[Endereço]',
    dpo: null,
  },
  // Segunda cidade só para provar o white label. Cor e dados são PLACEHOLDER [PENDENTE].
  maringa: {
    slug: 'maringa',
    nome: 'Maringá',
    marca: 'Maringá Tem',
    logo: { nome: 'Maringá', etiqueta: 'Tem' },
    uf: 'PR',
    cepPadrao: '87000-000',
    acento: '#1F7A3F',
    associacao: '[associação parceira]',
    slogan: 'Tudo o que a cidade tem, num lugar só.',
    cepsAtendidos: ['87000', '87001', '87002', '87003', '87004', '87005', '87006', '87007', '87008', '87009'],
    dominios: ['maringa.localhost', 'maringatem.com.br', 'www.maringatem.com.br'],
    razaoSocialOperadora: '[Razão social da operadora]',
    cnpjOperadora: '[00.000.000/0000-00]',
    enderecoOperadora: '[Endereço]',
    dpo: null,
  },
};

export const TENANT_SLUGS = Object.keys(TENANTS);
