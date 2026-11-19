'use client';

import Link from 'next/link';
import { useCaminho } from '@/hooks/useCaminho';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { totalItens, useComprador } from '@/stores/comprador';

/**
 * Barra inferior flutuante do mobile/PWA (CLAUDE.md §5.1): Início, Categorias,
 * Sacola e Conta, com o item ativo em bloco marinho. Some no desktop (≥ 900 px)
 * e na página de produto, onde a barra de compra fixa ocupa o lugar.
 */
export function BarraInferior() {
  const path = useCaminho();
  const usuario = useComprador((s) => (s.hidratado ? s.usuario : null));
  const qtd = useComprador((s) => (s.hidratado ? totalItens(s.itens) : 0));
  if (path.startsWith('/p/')) return null;

  const itens: Array<{ href: string; icone: NomeIcone; rotulo: string; ativo: boolean; badge?: number }> = [
    { href: '/', icone: 'home', rotulo: 'Início', ativo: path === '/' },
    {
      href: '/categorias',
      icone: 'grid',
      rotulo: 'Categorias',
      ativo: path === '/categorias' || path.startsWith('/c/'),
    },
    {
      href: '/sacola',
      icone: 'bag',
      rotulo: 'Sacola',
      ativo: path === '/sacola' || path === '/checkout',
      badge: qtd,
    },
    {
      href: usuario ? '/conta' : '/entrar',
      icone: 'user',
      rotulo: usuario ? 'Conta' : 'Entrar',
      ativo: ['/conta', '/entrar', '/cadastro', '/pedido'].some((p) => path.startsWith(p)),
    },
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-3 right-3 z-40 grid grid-cols-4 gap-1 rounded-xl bg-branco p-2 shadow-2 lg:hidden"
    >
      {itens.map((i) => (
        <Link
          key={i.rotulo}
          href={i.href}
          aria-current={i.ativo ? 'page' : undefined}
          className={`relative flex min-h-toque flex-col items-center gap-[3px] rounded-[16px] py-[7px] text-[11px] ${
            i.ativo
              ? 'bg-marinho font-semibold text-branco hover:text-branco'
              : 'font-medium text-grafite-2 hover:text-marinho'
          }`}
        >
          <Icone nome={i.icone} tamanho="lg" />
          {i.rotulo}
          {!!i.badge && (
            <span className="badge-count right-[calc(50%-22px)] top-0.5 border-branco">{i.badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}
