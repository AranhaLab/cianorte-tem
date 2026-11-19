import type { MetadataRoute } from 'next';

/** Robôs de busca: vitrine aberta; áreas pessoais, painel e administração fora do índice. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/conta',
        '/checkout',
        '/pedido',
        '/sacola',
        '/entrar',
        '/cadastro',
        '/lojista',
        '/painel',
        '/admin',
        '/busca',
      ],
    },
  };
}
