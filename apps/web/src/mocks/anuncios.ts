/**
 * Vagas e criativos de anúncio (mock). Valores são EXEMPLOS [PROPOSTA] — CLAUDE.md §9.
 * Hora = diária × 0,08 (mín. 6 h). Teto: 30 dias por contratação.
 */
import type { CriativoAnuncio, VagaAnuncio } from '@/types/domain';
import { CATALOGO } from './catalogo';

/** Nome e cor da loja anunciante (a "logo" da demo é a sigla sobre a cor da loja). */
const marcaDe = (lojaId: string) => {
  const l = CATALOGO.cianorte?.lojas.find((x) => x.id === lojaId);
  return l ? { nome: l.nome, cor: l.cor, logo: `/marcas/${lojaId}.webp`, lojaId } : undefined;
};

export const VAGAS: VagaAnuncio[] = [
  {
    id: 'H1',
    modoCompra: 'lance', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Vitrine principal (carrossel do topo)',
    pagina: 'home',
    posicao: 'Topo da home, abaixo do cabeçalho',
    formato: { desktop: '1200 × 400 px', mobile: '800 × 600 px', proporcao: '3:1 (mobile 4:3)' },
    precoDiaCentavos: 200000,
    rotacao: 4,
    status: 'leilao',
    lanceAtualCentavos: 200000,
    lances: 7,
    terminaEm: '2 d 14 h',
    ocupadoAte: null,
  },
  {
    id: 'M1',
    modoCompra: 'direta', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Faixa entre seções',
    pagina: 'home',
    posicao: 'Entre "Mais vendidos" e "Ofertas"',
    formato: { desktop: '1200 × 180 px', mobile: '800 × 300 px', proporcao: '20:3 (mobile 8:3)' },
    precoDiaCentavos: 50000,
    rotacao: 2,
    status: 'disponivel',
    lanceAtualCentavos: null,
    lances: 0,
    terminaEm: null,
    ocupadoAte: null,
  },
  {
    id: 'M2',
    modoCompra: 'direta', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Dupla de destaques',
    pagina: 'home',
    posicao: 'Antes de "Lojas da cidade"',
    formato: { desktop: '2 × 580 × 240 px', mobile: '800 × 330 px', proporcao: '29:12' },
    precoDiaCentavos: 50000,
    rotacao: 2,
    status: 'ocupado',
    lanceAtualCentavos: null,
    lances: 0,
    terminaEm: null,
    ocupadoAte: '28/11',
  },
  {
    id: 'C1',
    modoCompra: 'direta', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Produto patrocinado no carrossel',
    pagina: 'home',
    posicao: 'Primeira posição de "Ofertas" e "Em alta"',
    formato: {
      desktop: 'Foto do produto 1:1 (moda 4:5)',
      mobile: 'Mesma foto',
      proporcao: 'Usa a mídia do produto',
    },
    precoDiaCentavos: 1200,
    rotacao: 3,
    status: 'disponivel',
    lanceAtualCentavos: null,
    lances: 0,
    terminaEm: null,
    ocupadoAte: null,
  },
  {
    id: 'L1',
    modoCompra: 'direta', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Lateral da categoria',
    pagina: 'categoria',
    posicao: 'Coluna lateral das páginas de categoria (desktop) / após o 6º produto (mobile)',
    formato: { desktop: '300 × 600 px', mobile: '800 × 300 px', proporcao: '1:2 (mobile 8:3)' },
    precoDiaCentavos: 1800,
    rotacao: 2,
    status: 'disponivel', // disponibilidade para a categoria da loja de demonstração (moda)
    lanceAtualCentavos: null,
    lances: 0,
    terminaEm: null,
    ocupadoAte: null,
  },
  {
    id: 'K1',
    modoCompra: 'direta', // [PROPOSTA] H1 só por lance; demais por compra direta
    nome: 'Topo da categoria',
    pagina: 'categoria',
    posicao: 'Banner de abertura de cada categoria',
    formato: { desktop: '1200 × 300 px', mobile: '800 × 400 px', proporcao: '4:1 (mobile 2:1)' },
    precoDiaCentavos: 2800,
    rotacao: 3,
    status: 'disponivel',
    lanceAtualCentavos: null,
    lances: 0,
    terminaEm: null,
    ocupadoAte: null,
  },
];

/** [PROPOSTA] T1: letreiro de ofertas na barra do topo (todas as páginas). Só texto, menor destaque, menor preço. */
VAGAS.push({
  id: 'T1',
  modoCompra: 'direta',
  nome: 'Letreiro de ofertas',
  pagina: 'home',
  posicao: 'Barra abaixo do cabeçalho, em todas as páginas da vitrine',
  formato: { desktop: 'Texto até 80 caracteres', mobile: 'Texto até 80 caracteres', proporcao: 'texto' },
  precoDiaCentavos: 15000,
  rotacao: 8,
  status: 'disponivel',
  lanceAtualCentavos: null,
  lances: 0,
  terminaEm: null,
  ocupadoAte: null,
});

const CRIATIVOS_CIANORTE: CriativoAnuncio[] = [
  {
    vaga: 'H1',
    titulo: 'Semana da Moda de Cianorte',
    sub: 'Peças direto das confecções da cidade com até 30% off',
    cta: 'Ver coleção',
    fundo: '#14213D',
    texto: '#FFFFFF',
    destaque: '#D7263D',
    href: '/c/moda',
    imagem: '/anuncios/h1-moda.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Confecções Vale Azul',
    marca: marcaDe('vale-azul'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'H1',
    titulo: 'Reforma sem sair de casa',
    sub: 'Material de construção com entrega amanhã',
    cta: 'Comprar agora',
    fundo: '#1F4FA3',
    texto: '#FFFFFF',
    destaque: '#F7F6F2',
    href: '/c/construcao',
    imagem: '/anuncios/h1-reforma.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Casa & Obra Noroeste',
    marca: marcaDe('casa-obra'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'H1',
    titulo: 'Compras do mês em 2 horas',
    sub: 'Mercado com retirada na loja ou entrega rápida',
    cta: 'Fazer compras',
    fundo: '#177A4E',
    texto: '#FFFFFF',
    destaque: '#F7F6F2',
    href: '/c/mercado',
    imagem: '/anuncios/h1-mercado.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Mercado Bom Preço',
    marca: marcaDe('bom-preco'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'M1',
    titulo: 'Enxoval bordado à mão, feito em Cianorte',
    sub: 'Frete grátis acima de R$ 150 no centro',
    cta: 'Conhecer',
    fundo: '#F4EEF0',
    texto: '#14213D',
    href: '/loja/lar-bordado',
    imagem: '/anuncios/m1-enxoval.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Lar Bordado',
    marca: marcaDe('lar-bordado'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'H1',
    titulo: 'Enxoval para renovar a casa',
    sub: 'Cama, mesa e banho de lojas da cidade',
    cta: 'Conhecer a loja',
    fundo: '#8A3A5C',
    texto: '#FFFFFF',
    href: '/loja/lar-bordado',
    imagem: '/anuncios/m1-enxoval.webp',
    anunciante: 'Lar Bordado',
    marca: marcaDe('lar-bordado'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'M2',
    titulo: 'Troque seu celular',
    sub: 'Avaliamos seu usado na loja',
    cta: 'Ver ofertas',
    fundo: '#2B2F3A',
    texto: '#FFFFFF',
    href: '/loja/ponto-cel',
    imagem: '/anuncios/m2-celular.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Ponto do Celular',
    marca: marcaDe('ponto-cel'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'M2',
    titulo: 'Banho e tosa com hora marcada',
    sub: 'Peça pelo app, busque na loja',
    cta: 'Saiba mais',
    fundo: '#FDF3E1',
    texto: '#14213D',
    href: '/loja/pet-amigo',
    imagem: '/anuncios/m2-pet.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Pet Amigo',
    marca: marcaDe('pet-amigo'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'L1',
    categoriaId: 'moveis',
    titulo: 'Sala nova até o Natal',
    sub: 'Racks e poltronas com montagem inclusa',
    cta: 'Ver móveis',
    fundo: '#5B4632',
    texto: '#FFFFFF',
    href: '/loja/moveis-vale',
    imagem: '/anuncios/l1-sala.webp', // foto ilustrativa (Unsplash)
    anunciante: 'Móveis do Vale',
    marca: marcaDe('moveis-vale'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'K1',
    categoriaId: 'mercado',
    titulo: 'Compras do mês no seu bairro',
    sub: 'Produtos do Mercado Bom Preço com entrega e retirada',
    cta: 'Ver loja',
    fundo: '#177A4E',
    texto: '#FFFFFF',
    href: '/loja/bom-preco',
    imagem: '/anuncios/h1-mercado.webp',
    anunciante: 'Mercado Bom Preço',
    marca: marcaDe('bom-preco'),
    modo: 'montar',
    efeito: 'veu',
  },
  {
    vaga: 'L1',
    categoriaId: 'mercado',
    titulo: 'Seu mercado perto de você',
    sub: 'Compre no Mercado Bom Preço',
    cta: 'Ver loja',
    fundo: '#177A4E',
    texto: '#FFFFFF',
    href: '/loja/bom-preco',
    imagem: '/anuncios/h1-mercado.webp',
    anunciante: 'Mercado Bom Preço',
    marca: marcaDe('bom-preco'),
    modo: 'montar',
    efeito: 'veu',
  },
];

/** Frases do letreiro (T1), cada uma de uma loja anunciante. */
const letreiro = (lojaId: string, titulo: string, href: string): CriativoAnuncio => {
  const marca = marcaDe(lojaId);
  return {
    vaga: 'T1',
    titulo,
    sub: '',
    cta: '',
    fundo: '#14213D',
    texto: '#FFFFFF',
    href,
    anunciante: marca?.nome ?? lojaId,
    marca,
  };
};
CRIATIVOS_CIANORTE.push(
  letreiro('vale-azul', 'Semana da Moda: camisaria com até 30% off', '/loja/vale-azul'),
  letreiro('bom-preco', 'Hortifrúti fresco com entrega em 2 horas', '/loja/bom-preco'),
  letreiro('casa-obra', 'Tintas e ferramentas: frete grátis acima de R$ 199', '/loja/casa-obra'),
  letreiro('pet-amigo', 'Banho e tosa com hora marcada pelo app', '/loja/pet-amigo'),
  letreiro('moveis-vale', 'Sala nova até o Natal, com montagem inclusa', '/loja/moveis-vale'),
);

/** Criativos no ar por tenant. K1 sem criativo = mostra "Espaço publicitário" (convite para anunciar). */
const anunciosDeCategoria: CriativoAnuncio[] = (CATALOGO.cianorte?.categorias ?? []).flatMap((categoria) => {
  const produto = CATALOGO.cianorte?.produtos.find(
    (item) =>
      item.categoriaId === categoria.id && item.midias.some((midia) => midia.tipo === 'imagem' && midia.url),
  );
  const loja = CATALOGO.cianorte?.lojas.find((item) => item.id === produto?.lojaId);
  const imagem = produto?.midias.find((midia) => midia.tipo === 'imagem' && midia.url)?.url;
  if (!loja || !imagem) return [];
  return (['K1', 'L1'] as const)
    .filter(
      (vaga) =>
        !CRIATIVOS_CIANORTE.some((anuncio) => anuncio.vaga === vaga && anuncio.categoriaId === categoria.id),
    )
    .map((vaga) => ({
      vaga,
      categoriaId: categoria.id,
      titulo: `Descubra ${categoria.nome.toLowerCase()}`,
      sub: `Produtos de ${loja.nome} em Cianorte`,
      cta: 'Ver loja',
      fundo: loja.cor,
      texto: '#FFFFFF',
      href: `/loja/${loja.id}`,
      imagem,
      anunciante: loja.nome,
      marca: marcaDe(loja.id),
      modo: 'montar' as const,
      efeito: 'nenhum' as const,
    }));
});

export const CRIATIVOS: Record<string, CriativoAnuncio[]> = {
  cianorte: [...CRIATIVOS_CIANORTE, ...anunciosDeCategoria],
  maringa: [],
};
