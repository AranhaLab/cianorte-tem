'use client';

import Image from 'next/image';
import { useRef, useState, type ChangeEvent } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { useLogoSalva, useLogos } from '@/stores/logos';
import type { Loja } from '@/types/domain';
import { avisar } from './Comum';

const LIMITE_BYTES = 2 * 1024 * 1024;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

export function LogoCadastro({ loja }: { loja: Loja }) {
  const tenant = useTenant();
  const logoSalva = useLogoSalva(tenant.slug, loja.id);
  const salvarLogo = useLogos((s) => s.salvarLogo);
  const [novaLogo, setNovaLogo] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const sequencia = useRef(0);
  const logo = novaLogo ?? logoSalva ?? loja.logo;

  const escolher = (event: ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    const atual = ++sequencia.current;
    setErro('');
    setNovaLogo(null);
    setCarregando(false);
    if (!arquivo) return;
    if (!TIPOS.includes(arquivo.type) || arquivo.size > LIMITE_BYTES) {
      setErro('Escolha uma imagem JPG, PNG ou WebP de até 2 MB.');
      return;
    }

    setCarregando(true);
    const leitor = new FileReader();
    const falhar = () => {
      if (atual !== sequencia.current) return;
      setCarregando(false);
      setErro('Não foi possível abrir a imagem. Escolha outro arquivo.');
    };
    leitor.onerror = falhar;
    leitor.onload = () => {
      if (atual !== sequencia.current || typeof leitor.result !== 'string') return;
      const imagem = new window.Image();
      imagem.onerror = falhar;
      imagem.onload = () => {
        if (atual !== sequencia.current) return;
        try {
          const proporcao = Math.min(1, 512 / Math.max(imagem.naturalWidth, imagem.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(imagem.naturalWidth * proporcao));
          canvas.height = Math.max(1, Math.round(imagem.naturalHeight * proporcao));
          const contexto = canvas.getContext('2d');
          if (!contexto) return falhar();
          contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
          setNovaLogo(canvas.toDataURL('image/webp', 0.85));
          setCarregando(false);
        } catch {
          falhar();
        }
      };
      imagem.src = leitor.result;
    };
    leitor.readAsDataURL(arquivo);
  };

  const salvar = (imagem: string | null) => {
    try {
      salvarLogo(tenant.slug, loja.id, imagem);
      setNovaLogo(null);
      setErro('');
      avisar(imagem ? 'Logo da loja salva.' : 'Logo de demonstração restaurada.');
    } catch {
      try {
        salvarLogo(tenant.slug, loja.id, logoSalva ?? null);
      } catch {
        // O estado anterior volta à tela mesmo quando o armazenamento está cheio.
      }
      setErro('Não foi possível salvar a logo neste navegador. Tente uma imagem menor.');
    }
  };

  return (
    <section className="card flex flex-col gap-3" aria-labelledby="titulo-logo-loja">
      <h2 id="titulo-logo-loja">Logo da loja</h2>
      <p className="m-0 text-sm text-grafite-2">Use a identidade da loja na vitrine e nos anúncios.</p>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-solid border-borda bg-branco">
          {logo ? (
            <Image
              src={logo}
              alt="Prévia da logo da loja"
              width={96}
              height={96}
              unoptimized
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-grafite-2">Sem logo</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="logo-loja" className="text-sm font-semibold">
            Selecionar logo
          </label>
          <input
            id="logo-loja"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={escolher}
            aria-describedby={erro ? 'ajuda-logo erro-logo' : 'ajuda-logo'}
          />
          <span id="ajuda-logo" className="text-xs text-grafite-2">
            JPG, PNG ou WebP de até 2 MB. A imagem é ajustada para exibição.
          </span>
          {erro && (
            <span id="erro-logo" role="alert" className="text-sm text-acento-escuro">
              {erro}
            </span>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn-sm min-h-toque"
              disabled={!novaLogo || carregando}
              onClick={() => novaLogo && salvar(novaLogo)}
            >
              Salvar logo
            </button>
            {(logoSalva || novaLogo) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm min-h-toque"
                onClick={() => {
                  if (novaLogo) setNovaLogo(null);
                  else salvar(null);
                }}
              >
                {' '}
                {novaLogo ? 'Cancelar seleção' : 'Restaurar logo original'}
              </button>
            )}
          </div>
        </div>
      </div>
      <span className="text-xs text-grafite-2">Na demonstração, a logo fica salva neste navegador.</span>
    </section>
  );
}
