import { tenantDoHost } from '@/lib/tenant/doHost';

/**
 * Manifest do PWA por cidade: nome, ícones e cor vêm do tenant resolvido pelo host.
 * "Adicionar à tela inicial" instala com o nome da identidade da cidade (ex.: "MKT Local").
 */
export function GET(req: Request) {
  const t = tenantDoHost(req.headers.get('host'));
  if (!t) return new Response('Cidade não encontrada', { status: 404 });

  const manifest = {
    id: `/?cidade=${t.slug}`,
    name: t.marca,
    short_name: t.marca,
    description: `Marketplace das lojas de ${t.nome}. ${t.slogan}`,
    lang: 'pt-BR',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: t.paleta?.linho ?? '#F7F6F2', // token linho da identidade
    theme_color: t.paleta?.marinho ?? '#14213D', // token marinho da identidade
    categories: ['shopping'],
    icons: [
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Ofertas', url: '/ofertas' },
      { name: 'Sacola', url: '/sacola' },
      { name: 'Meus pedidos', url: '/conta/pedidos' },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      Vary: 'Host',
    },
  });
}
