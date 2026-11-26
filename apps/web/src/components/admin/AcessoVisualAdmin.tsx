'use client';

import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { bannerAtivo } from '@/lib/regras/acessoVisual';
import { useConfigAcesso, type TelaAcesso } from '@/stores/acessoVisual';
import { AguardaAdmin, TituloAdmin } from './Comum';
import { TELAS_ACESSO } from './EditorAcesso';

/**
 * Admin › Telas de acesso: lista as 4 telas e abre o editor em tela cheia, com prévia ao
 * vivo (CLAUDE.md §13.18).
 */
export function AcessoVisualAdmin() {
  return (
    <AguardaAdmin>
      <TituloAdmin
        titulo="Telas de acesso"
        apoio="Configure as telas de entrada e cadastro de compradores e lojistas, vendo o resultado na hora."
      />
      <p className="banner-info bg-azul-nevoa text-azul-escuro">
        Na demonstração, as alterações e imagens ficam neste navegador e nesta cidade.
      </p>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
        {TELAS_ACESSO.map(([id, nome, caminho]) => (
          <CartaoTela key={id} tela={id} nome={nome} caminho={caminho} />
        ))}
      </ul>
    </AguardaAdmin>
  );
}

function CartaoTela({ tela, nome, caminho }: { tela: TelaAcesso; nome: string; caminho: string }) {
  const tenant = useTenant();
  const config = useConfigAcesso(tenant.slug, tela);
  const campanha = !!config?.banner && bannerAtivo(config.banner);
  return (
    <li className="card flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="flex flex-col gap-0.5">
          <h2 className="m-0 text-lg">{nome}</h2>
          <span className="font-mono text-xs text-grafite-2">{caminho}</span>
        </span>
        <span className="flex flex-wrap gap-1.5">
          <span className={`status ${config ? 'st-blue' : 'st-gray'}`}>
            {config ? 'Personalizada' : 'Padrão'}
          </span>
          {campanha && <span className="status st-amber">Campanha no ar</span>}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link
          href={`/admin/acesso/editor?tela=${tela}`}
          className="btn btn-primary btn-sm min-h-toque"
          aria-label={`Editar com prévia: ${nome}`}
        >
          <Icone nome="edit" tamanho="sm" />
          Editar com prévia
        </Link>
        <Link href={caminho} target="_blank" className="btn btn-ghost btn-sm min-h-toque">
          Abrir tela ↗
        </Link>
      </div>
    </li>
  );
}
