/**
 * Camada de dados do front. Páginas e componentes só falam com `api.*`.
 * Hoje responde com mocks; amanhã com o back-end NestJS, sem mudar as assinaturas.
 */
import { categorias, lojas, produtos, tenant, vagas, vitrine } from './catalogo';
import { anuncios, auth, checkout, me, pagamento, painel, sacola } from './transacoes';

export const api = {
  tenant,
  vitrine,
  categorias,
  produtos,
  lojas,
  vagas,
  auth,
  me,
  sacola,
  checkout,
  pagamento,
  painel,
  anuncios,
};

export { ApiError, usandoMocks } from './http';
export type { Ordem, Filtro, VitrineHome, VitrineCategoria } from './catalogo';
