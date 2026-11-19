'use client';

import Image from 'next/image';
import { useTenant } from '@/components/providers/TenantProvider';
import { useLogoSalva } from '@/stores/logos';

/** Exibe a logo cadastrada na demonstração ou as iniciais da loja. */
export function LogoLoja({
  lojaId,
  iniciais,
  logoPadrao,
}: {
  lojaId: string;
  iniciais: string;
  logoPadrao?: string;
}) {
  const tenant = useTenant();
  const logo = useLogoSalva(tenant.slug, lojaId) ?? logoPadrao;
  if (!logo) return iniciais;
  return (
    <Image
      src={logo}
      alt=""
      width={80}
      height={80}
      // Só a logo enviada na demo (data: URL) dispensa otimização; as do projeto passam pelo next/image.
      unoptimized={logo.startsWith('data:')}
      className="h-full w-full rounded-[inherit] object-contain"
    />
  );
}
