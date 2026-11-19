import type { Config } from 'tailwindcss';

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
        DEFAULT: '#14213D', // cabeçalho, rodapé, títulos, item ativo
        2: '#1C2C50',
        profundo: '#0F1830',
      },
      azul: {
        DEFAULT: '#1F4FA3', // ação: botões, links, foco
        escuro: '#173E82',
        claro: '#8FB0EA', // texto de apoio sobre marinho
        borda: '#CDD6EA',
        nevoa: '#EEF2FA', // fundos de apoio
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
      linho: '#F7F6F2', // fundo da página
      grafite: {
        DEFAULT: '#1A1F2B', // texto principal
        2: '#4A5468', // texto secundário
        3: '#6B7487', // texto terciário
      },
      borda: {
        DEFAULT: '#E3E1DA',
        fria: '#DCE1EC',
      },
      // Textos sobre fundo marinho (cabeçalho, rodapé, banners escuros)
      'sobre-marinho': {
        DEFAULT: '#C9D3EA',
        forte: '#DCE3F2',
        claro: '#E6EBF5',
        suave: '#AEBBD6',
      },
      neutro: {
        50: '#FAFBFD',
        100: '#F6F7FA',
        150: '#F1F3F8',
        200: '#EEF0F5',
        300: '#E3E7EF',
        400: '#CDD3DF',
        500: '#A3AABA',
        700: '#333B4D',
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
        1: '0 1px 2px rgba(20, 33, 61, .06), 0 4px 14px rgba(20, 33, 61, .06)',
        2: '0 12px 32px rgba(20, 33, 61, .16)',
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
  plugins: [],
};

export default config;
