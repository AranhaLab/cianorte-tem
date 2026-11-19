import Image from 'next/image';
import type { EfeitoArte } from '@/types/domain';

/** '#RRGGBB' + opacidade (0 a 1) → '#RRGGBBAA'. A cor da marca é dado do anunciante. */
const alfa = (hex: string, a: number) =>
  /^#[0-9a-f]{6}$/i.test(hex)
    ? `${hex}${Math.round(a * 255)
        .toString(16)
        .padStart(2, '0')}`
    : hex;

const claro = (hex: string) =>
  /^#[0-9a-f]{6}$/i.test(hex) &&
  parseInt(hex.slice(1, 3), 16) * 0.299 +
    parseInt(hex.slice(3, 5), 16) * 0.587 +
    parseInt(hex.slice(5, 7), 16) * 0.114 >
    180;

/**
 * Foto do criativo atrás do texto do anúncio (CLAUDE.md §9.1). Efeitos:
 * - "veu" (padrão): véu neutro uniforme que suaviza a foto para a leitura;
 * - "degrade": degradê na cor da marca, do lado do texto para a foto
 *   (no L1, de baixo para cima); no celular vira um véu na mesma cor;
 * - "nenhum": só a foto — para arte pronta, que já traz o próprio texto.
 * `enquadramento` aplica o zoom e a posição escolhidos no editor da arte.
 * A foto é decorativa (alt vazio): o conteúdo do anúncio é o texto do link.
 */
export function FotoCriativo({
  src,
  fundo,
  sizes,
  prioridade = false,
  efeito = 'veu',
  cor = fundo,
  vertical = false,
  enquadramento,
}: {
  src: string;
  fundo: string;
  sizes: string;
  prioridade?: boolean;
  efeito?: EfeitoArte;
  /** Cor do degradê (cor da marca). Padrão: a cor de fundo do criativo. */
  cor?: string;
  /** L1 lateral: texto embaixo, foto em cima. */
  vertical?: boolean;
  enquadramento?: { zoom: number; x: number; y: number };
}) {
  const { zoom = 1, x = 50, y = 50 } = enquadramento ?? {};
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        sizes={sizes}
        priority={prioridade}
        unoptimized={src.startsWith('data:')}
        className="object-cover"
        style={
          enquadramento
            ? { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})`, transformOrigin: `${x}% ${y}%` }
            : undefined
        }
      />
      {efeito === 'veu' && (
        <span
          aria-hidden
          className={`absolute inset-0 ${claro(fundo) ? 'bg-branco/[.65]' : 'bg-marinho/40'}`}
        />
      )}
      {efeito === 'degrade' &&
        (vertical ? (
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background: `linear-gradient(0deg, ${cor} 0%, ${cor} 36%, ${alfa(cor, 0.75)} 55%, ${alfa(cor, 0)} 85%)`,
            }}
          />
        ) : (
          <>
            <span
              aria-hidden
              className="absolute inset-0 lg:hidden"
              style={{ backgroundColor: alfa(cor, 0.82) }}
            />
            <span
              aria-hidden
              className="absolute inset-0 hidden lg:block"
              style={{
                background: `linear-gradient(90deg, ${cor} 0%, ${cor} 32%, ${alfa(cor, 0.8)} 50%, ${alfa(cor, 0)} 78%)`,
              }}
            />
          </>
        ))}
    </>
  );
}
