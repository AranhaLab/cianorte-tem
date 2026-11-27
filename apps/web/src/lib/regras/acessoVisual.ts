import type { Tenant } from '@/types/domain';
import type { ConfigAcesso, TelaAcesso } from '@/stores/acessoVisual';

/* eslint-disable no-restricted-syntax -- Valores iniciais do cadastro de cores, editáveis pelo administrador. */
export function padraoAcesso(t: Tenant, tela: TelaAcesso): ConfigAcesso {
  // Cores iniciais = paleta da identidade da cidade (padrão: a de Cianorte).
  const p = (chave: string, padrao: string) => t.paleta?.[chave] ?? padrao;
  const comum = {
    fundo: t.fundoAcesso?.src ?? '',
    corFundo: p('marinho', '#14213D'),
    corTexto: '#FFFFFF',
    corMarca: '#FFFFFF',
    corEtiqueta: t.acento,
    corTextoEtiqueta: '#FFFFFF',
    corDestaque: p('azul-claro', '#8FB0EA'),
    corCartoes: p('marinho', '#14213D'),
    corFormulario: '#FFFFFF',
    corTextoFormulario: '#1A1F2B',
    corBotao: p('azul', '#1F4FA3'),
    corTextoBotao: '#FFFFFF',
    corLinks: p('azul', '#1F4FA3'),
    opacidade: 65,
    mostrarConteudoMobile: false,
    tituloFormulario: '',
    apoioFormulario: '',
    selos: tela.startsWith('lojista')
      ? [
          { icone: 'lock' as const, texto: 'Acesso seguro' },
          { icone: 'shield' as const, texto: 'LGPD' },
          { icone: 'medal' as const, texto: `Parceria ${t.associacao}` },
        ]
      : [
          { icone: 'check' as const, texto: 'Pix' },
          { icone: 'card' as const, texto: 'Cartão de crédito' },
          { icone: 'shield' as const, texto: 'LGPD' },
          { icone: 'medal' as const, texto: `Parceria ${t.associacao}` },
        ],
    banner: {
      ativo: false,
      patrocinado: false,
      anunciante: '',
      imagem: '',
      titulo: '',
      descricao: '',
      link: '',
      inicio: '',
      fim: '',
    },
  };
  switch (tela) {
    case 'entrar':
      return {
        ...comum,
        titulo: `Tudo o que ${t.nome} tem,`,
        tituloDestaque: 'a um toque de você.',
        apoio: 'Compre das lojas da cidade e receba no mesmo dia, ou retire no balcão sem pagar frete.',
        destaques: [
          { icone: 'store', titulo: 'Lojas locais verificadas', texto: 'CNPJ e endereço na cidade' },
          { icone: 'truck', titulo: 'Entrega no mesmo dia', texto: 'ou retirada grátis no balcão' },
          { icone: 'lock', titulo: 'Pagamento protegido', texto: 'Pix ou cartão, dados criptografados' },
          { icone: 'refresh', titulo: '7 dias para desistir', texto: 'direito de arrependimento garantido' },
        ],
      };
    case 'cadastro':
      return {
        ...comum,
        titulo: 'Crie sua conta e compre',
        tituloDestaque: `das lojas de ${t.nome}.`,
        apoio:
          'Uma conta só para comprar de todas as lojas da cidade, acompanhar pedidos e conversar com as lojas.',
        destaques: [
          { icone: 'bag', titulo: 'Sacola com várias lojas', texto: 'um checkout só' },
          { icone: 'chat', titulo: 'Converse com a loja', texto: 'depois da compra' },
          { icone: 'heart', titulo: 'Favoritos e endereços', texto: 'salvos na sua conta' },
          { icone: 'shield', titulo: 'Seus dados protegidos', texto: 'pela LGPD, você decide' },
        ],
      };
    case 'lojista-entrar':
      return {
        ...comum,
        titulo: 'Sua loja na vitrine',
        tituloDestaque: `de ${t.nome}.`,
        apoio: `Pedidos, estoque, anúncios e financeiro num painel só, com o apoio da ${t.associacao}.`,
        destaques: [
          { icone: 'receipt', titulo: 'Pedidos num lugar só', texto: 'entrega e retirada por loja' },
          { icone: 'box', titulo: 'Estoque sincronizado', texto: 'manual, planilha ou API' },
          { icone: 'megaphone', titulo: 'Anúncios na vitrine', texto: 'home, categorias e letreiro' },
          { icone: 'chart', titulo: 'Financeiro claro', texto: 'vendas, comissão e repasse' },
        ],
      };
    case 'lojista-cadastro':
      return {
        ...comum,
        titulo: 'Venda para toda',
        tituloDestaque: `${t.nome}.`,
        apoio: `Sua loja aberta 24 horas, com o apoio da ${t.associacao}.`,
        destaques: [
          { icone: 'doc', titulo: 'Cadastro com CNPJ', texto: 'análise em até 2 dias úteis' },
          { icone: 'box', titulo: 'Estoque ligado', texto: 'ao sistema da sua loja' },
          { icone: 'truck', titulo: 'Entrega própria', texto: 'ou retirada no balcão' },
          { icone: 'star', titulo: 'Selos de confiança', texto: 'Loja oficial e Indicada' },
        ],
      };
  }
}

export function bannerAtivo(b: ConfigAcesso['banner'], agora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(agora);
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  const hoje = `${parte('year')}-${parte('month')}-${parte('day')}`;
  return b.ativo && !!b.imagem && (!b.inicio || hoje >= b.inicio) && (!b.fim || hoje <= b.fim);
}

export function destinoValido(s: string) {
  if (!s) return true;
  if (/^\/(?![\/\\])/.test(s)) return !/[\u0000-\u001f]/.test(s);
  try {
    const url = new URL(s);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
}
