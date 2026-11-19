import { ImageResponse } from 'next/og';
import { monograma, tenantDoHost } from '@/lib/tenant/doHost';

/**
 * Ícones do app por cidade (mesmo desenho do protótipo: monograma + etiqueta "Tem"
 * com pesponto, na cor da bandeira da cidade).
 *   /icons/icon.svg  /icons/192.png  /icons/512.png  /icons/maskable-512.png  /icons/apple-180.png
 */
const MARINHO = '#14213D';
const BRANCO = '#FFFFFF';

const PNG: Record<string, { lado: number; maskable?: boolean }> = {
  '192.png': { lado: 192 },
  '512.png': { lado: 512 },
  'maskable-512.png': { lado: 512, maskable: true },
  'apple-180.png': { lado: 180, maskable: true }, // iOS arredonda sozinho: fundo cheio
};

function svg(sigla: string, acento: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="${MARINHO}"/><text x="256" y="236" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-weight="800" font-size="120" fill="${BRANCO}">${sigla}</text><g transform="translate(136 280)"><rect width="240" height="110" rx="22" fill="${acento}"/><rect x="10" y="10" width="220" height="90" rx="14" fill="none" stroke="${BRANCO}" stroke-opacity=".6" stroke-width="4" stroke-dasharray="12 10"/><circle cx="44" cy="55" r="12" fill="${MARINHO}"/><text x="140" y="78" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-weight="700" font-size="64" fill="${BRANCO}">Tem</text></g></svg>`;
}

export async function GET(req: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const t = tenantDoHost(req.headers.get('host'));
  if (!t) return new Response('Cidade não encontrada', { status: 404 });
  const sigla = monograma(t.marca);
  const cache = { 'Cache-Control': 'public, max-age=86400', Vary: 'Host' };

  if (arquivo === 'icon.svg')
    return new Response(svg(sigla, t.acento), { headers: { 'Content-Type': 'image/svg+xml', ...cache } });

  const cfg = PNG[arquivo];
  if (!cfg) return new Response('Não encontrado', { status: 404 });

  // Ícone "maskable": conteúdo na zona segura (80%) e fundo até a borda.
  const k = cfg.lado / 512;
  const escala = cfg.maskable ? 0.8 : 1;
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: cfg.maskable ? MARINHO : 'transparent',
      }}
    >
      <div
        style={{
          width: 512 * k * escala,
          height: 512 * k * escala,
          borderRadius: cfg.maskable ? 0 : 112 * k,
          background: MARINHO,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18 * k * escala,
        }}
      >
        <div style={{ color: BRANCO, fontSize: 120 * k * escala, fontWeight: 800, lineHeight: 1 }}>
          {sigla}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22 * k * escala,
            background: t.acento,
            borderRadius: 22 * k * escala,
            padding: `${18 * k * escala}px ${34 * k * escala}px`,
            border: `${4 * k * escala}px dashed rgba(255,255,255,.6)`,
          }}
        >
          <div
            style={{
              width: 24 * k * escala,
              height: 24 * k * escala,
              borderRadius: 999,
              background: MARINHO,
            }}
          />
          <div style={{ color: BRANCO, fontSize: 64 * k * escala, fontWeight: 700, lineHeight: 1 }}>Tem</div>
        </div>
      </div>
    </div>,
    { width: cfg.lado, height: cfg.lado, headers: cache },
  );
}
