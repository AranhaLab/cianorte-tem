import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { PALETA_PADRAO, type Paleta } from './src/mocks/identidades';

/** Cor da marca lida da variável CSS (muda por identidade; padrão em :root). */
const v = (chave: keyof Paleta) => `rgb(var(--c-${chave}) / <alpha-value>)`;
const triplo = (hex: string) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/**
 * Tokens do Cianorte Tem (fonte: :root do css/styles.css do protótipo original + CLAUDE.md, seção 3).
 * Regra: nenhuma cor fora destes tokens no código. Cores que vêm de DADOS
 * (tom da categoria, cor da loja, fundo do criativo de anúncio) chegam pela API
 * e são aplicadas via style, não via classe.
 *
 * Paleta Tailwind padrão é DESLIGADA (theme.colors substitui, não estende):
 * `bg-blue-500` não existe, só os tokens abaixo.
 *
 * White label: `acento` muda por cidade. Vem de getTenant() e é injetado como
 * variável CSS (--acento-rgb) no <html>, por isso é declarado com rgb(var()).
 * As cores da marca (marinho, azul, linho, bordas, neutros) também são variáveis
 * (--c-*): a paleta padrão (Cianorte) entra no :root e a identidade da cidade
 * (src/mocks/identidades.ts) sobrescreve no <html> (CLAUDE.md §13.20).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Mesmos pontos de quebra do protótipo (css/styles.css do protótipo original).
    screens: {
      sm: '640px',
      md: '760px',
      lg: '900px', // vira desktop: cabeçalho completo, sem barra inferior
      xl: '1000px',
      '2xl': '1100px',
      '3xl': '1240px',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      branco: '#FFFFFF',
      marinho: {
        DEFAULT: v('marinho'), // cabeçalho, rodapé, títulos, item ativo
        2: v('marinho-2'),
        profundo: v('marinho-profundo'),
      },
      azul: {
        DEFAULT: v('azul'), // ação: botões, links, foco
        escuro: v('azul-escuro'),
        claro: v('azul-claro'), // texto de apoio sobre marinho
        borda: v('azul-borda'),
        nevoa: v('azul-nevoa'), // fundos de apoio
      },
      acento: {
        DEFAULT: 'rgb(var(--acento-rgb) / <alpha-value>)', // etiqueta "Tem", ofertas, alertas (pouco)
        escuro: 'rgb(var(--acento-escuro-rgb) / <alpha-value>)',
        claro: 'rgb(var(--acento-claro-rgb) / <alpha-value>)',
      },
      verde: {
        DEFAULT: '#177A4E', // "Loja da cidade", entrega, sucesso
        texto: '#145E3D',
        claro: '#E6F3EC',
      },
      aviso: {
        DEFAULT: '#C98A00',
        texto: '#7A5200',
        claro: '#FFF4DE',
      },
      linho: v('linho'), // fundo da página
      grafite: {
        DEFAULT: '#1A1F2B', // texto principal
        2: '#4A5468', // texto secundário
        3: '#6B7487', // texto terciário
      },
      borda: {
        DEFAULT: v('borda'),
        fria: v('borda-fria'),
      },
      // Textos sobre fundo marinho (cabeçalho, rodapé, banners escuros)
      'sobre-marinho': {
        DEFAULT: v('sobre-marinho'),
        forte: v('sobre-marinho-forte'),
        claro: v('sobre-marinho-claro'),
        suave: v('sobre-marinho-suave'),
      },
      neutro: {
        50: v('neutro-50'),
        100: v('neutro-100'),
        150: v('neutro-150'),
        200: v('neutro-200'),
        300: v('neutro-300'),
        400: v('neutro-400'),
        500: v('neutro-500'),
        700: v('neutro-700'),
      },
    },
    fontFamily: {
      titulo: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      ui: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'monospace'], // chaves de API e código
    },
    extend: {
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '24px',
      },
      boxShadow: {
        1: '0 1px 2px rgb(var(--c-marinho) / .06), 0 4px 14px rgb(var(--c-marinho) / .06)',
        2: '0 12px 32px rgb(var(--c-marinho) / .16)',
      },
      maxWidth: {
        container: '1240px',
      },
      spacing: {
        toque: '44px', // alvo mínimo de toque (acessibilidade)
        'bottom-nav': 'calc(92px + env(safe-area-inset-bottom))',
      },
      minHeight: {
        toque: '44px',
      },
      minWidth: {
        toque: '44px',
      },
    },
  },
  plugins: [
    // Paleta padrão no :root; a identidade da cidade sobrescreve no <html>.
    plugin(({ addBase }) =>
      addBase({
        ':root': Object.fromEntries(
          Object.entries(PALETA_PADRAO).map(([chave, hex]) => [`--c-${chave}`, triplo(hex)]),
        ),
      }),
    ),
  ],
};

export default config;
