import { NextResponse, type NextRequest } from 'next/server';
import { resolveTenantSlug } from '@/lib/tenant/resolve';

/**
 * White label: o host decide a cidade.
 *   cianorte.localhost:3000/p/p1      → reescreve para /cianorte/p/p1
 *   maringatem.com.br/c/moda          → reescreve para /maringa/c/moda
 * A URL vista pelo usuário não muda. Reescrever para um segmento [tenant]
 * permite que cada cidade tenha suas páginas em cache (ISR) separadas.
 */
export function middleware(req: NextRequest) {
  const fallback = process.env.DEFAULT_TENANT ?? 'cianorte';
  const slug = resolveTenantSlug(req.headers.get('host'), fallback);
  if (!slug) return new NextResponse('Cidade não encontrada', { status: 404 });

  const url = req.nextUrl.clone();
  url.pathname = `/${slug}${url.pathname === '/' ? '' : url.pathname}`;

  const headers = new Headers(req.headers);
  headers.set('x-tenant', slug);
  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  // Não reescreve arquivos estáticos, PWA nem internals do Next.
  matcher: [
    '/((?!_next/|api/|icons/|favicon|manifest|sw\\.js|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml)$).*)',
  ],
};
