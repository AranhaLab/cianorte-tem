import Link from 'next/link';
import { Marca } from '@/components/marca/Marca';
import { Icone } from '@/components/ui/Icone';
import type { Categoria, Tenant } from '@/types/domain';
import { BarraCategorias } from './BarraCategorias';
import { AcoesTopo, BotaoCep, Busca } from './CabecalhoCliente';

/** Faixa utilitária (desktop) + cabeçalho marinho fixo + barra de categorias. */
export function Cabecalho({ tenant, categorias }: { tenant: Tenant; categorias: Categoria[] }) {
  const itens = [
    ...categorias.map((c) => ({ href: `/c/${c.id}`, rotulo: c.nome })),
    { href: '/lojas', rotulo: 'Lojas' },
    { href: '/ofertas', rotulo: 'Ofertas' },
  ];
  return (
    <>
      <div className="hidden bg-marinho-profundo text-[12.5px] text-sobre-marinho-suave lg:block">
        <div className="mx-auto flex min-h-[38px] max-w-container items-center justify-between px-4">
          <span className="flex items-center gap-1.5">
            <Icone nome="pin" tamanho="sm" />O comércio de {tenant.nome}, perto de você · parceria{' '}
            {tenant.associacao}
          </span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-2.5">
              Seu comércio também tem lugar aqui
              <EtiquetaQueroVender />
            </span>
            <Link href="/painel" className="text-sobre-marinho-forte hover:text-branco">
              Painel do lojista →
            </Link>
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-marinho text-branco">
        <div className="mx-auto flex max-w-container flex-wrap items-center gap-3 px-4 py-2.5 lg:flex-nowrap lg:gap-5 lg:px-6 lg:py-3">
          <Link href="/" aria-label={`${tenant.marca} — início`} className="inline-flex items-center py-1">
            <Marca nome={tenant.nome} />
          </Link>
          <BotaoCep />
          <Busca cidade={tenant.nome} />
          <AcoesTopo />
        </div>
        <BarraCategorias itens={itens} categorias={categorias} />
      </header>
    </>
  );
}

/**
 * "Quero vender" no formato da etiqueta "Tem" da marca: fundo do acento da cidade,
 * texto branco, bolinha e pesponto tracejado. Destaque sem poluir (DECIDIDO 18/11/2026).
 */
function EtiquetaQueroVender() {
  return (
    <Link
      href="/vender"
      className="relative inline-flex h-[26px] items-center gap-1.5 rounded-[5px_10px_10px_5px] bg-acento pl-2 pr-3 text-[12.5px] font-bold text-branco transition-colors before:h-1.5 before:w-1.5 before:rounded-full before:bg-marinho-profundo before:content-[''] after:pointer-events-none after:absolute after:inset-[3px] after:rounded-[3px_7px_7px_3px] after:border after:border-dashed after:border-branco/55 after:content-[''] hover:bg-acento-escuro hover:text-branco"
    >
      Quero vender
    </Link>
  );
}
