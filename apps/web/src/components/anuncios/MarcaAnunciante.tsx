'use client';

import Image from 'next/image';
import { useTenant } from '@/components/providers/TenantProvider';
import { sigla } from '@/lib/regras/arteAnuncio';
import { useLogoSalva } from '@/stores/logos';
import type { CriativoAnuncio } from '@/types/domain';

/**
 * Selo de todo anúncio (CLAUDE.md §6 e §9.1): "Patrocinado" + logo + nome da loja,
 * num só lugar, para deixar evidente quem anuncia. Não é editável pelo lojista.
 * Sem logo cadastrada, mostra a sigla da loja sobre a cor dela.
 */
export function MarcaAnunciante({
  anuncio,
  className = 'relative self-start',
}: {
  anuncio: CriativoAnuncio;
  className?: string;
}) {
  const tenant = useTenant();
  const marca = anuncio.marca;
  const logo = useLogoSalva(tenant.slug, marca?.lojaId) ?? marca?.logo;

  if (!marca) return <span className={`pill pill-ad ${className}`}>Patrocinado · {anuncio.anunciante}</span>;
  return (
    <span
      className={`z-[1] inline-flex max-w-full items-center gap-2 rounded-[10px] bg-branco/95 py-1 pl-1 pr-2.5 text-marinho shadow-1 ${className}`}
    >
      {logo ? (
        <Image
          src={logo}
          alt=""
          width={28}
          height={28}
          unoptimized={logo.startsWith('data:')}
          className="h-7 w-7 flex-none rounded-[7px] bg-branco object-contain"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-7 w-7 flex-none items-center justify-center rounded-[7px] font-titulo text-[11px] font-bold text-branco"
          style={{ backgroundColor: marca.cor }}
        >
          {sigla(marca.nome)}
        </span>
      )}
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-[10px] font-bold uppercase tracking-wide text-grafite-2">Patrocinado</span>
        <span className="truncate text-xs font-bold">{marca.nome}</span>
      </span>
    </span>
  );
}
