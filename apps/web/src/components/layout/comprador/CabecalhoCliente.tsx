'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { totalItens, useComprador } from '@/stores/comprador';

export function BotaoCep() {
  const tenant = useTenant();
  const cep = useComprador((s) => (s.hidratado && s.cep) || tenant.cepPadrao);
  return (
    <button
      type="button"
      onClick={() => useComprador.getState().abrir('cep')}
      className="inline-flex min-h-toque items-center gap-1.5 rounded-[8px] border-0 bg-transparent px-1 text-[13px] text-sobre-marinho"
    >
      <Icone nome="pin" tamanho="sm" />
      <span>
        Entregar em <b className="font-semibold text-branco">{cep}</b>
      </span>
      <Icone nome="chevD" tamanho="sm" />
    </button>
  );
}

export function Busca({ cidade }: { cidade: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/busca?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <form
      role="search"
      action="/busca"
      onSubmit={enviar}
      className="order-3 flex h-[46px] min-w-0 max-w-full flex-[1_1_100%] items-center gap-2 rounded-[12px] bg-branco pl-3.5 pr-1 text-grafite-2 lg:order-none lg:max-w-[640px] lg:flex-[1_1_auto]"
    >
      <label htmlFor="q" className="sr-only">
        Buscar
      </label>
      <Icone nome="search" />
      <input
        id="q"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`O que você procura em ${cidade}?`}
        autoComplete="off"
        className="w-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-grafite outline-none"
      />
      <button type="submit" className="btn btn-primary min-h-[38px] rounded-[9px] px-3.5">
        Buscar
      </button>
    </form>
  );
}

export function AcoesTopo() {
  const usuario = useComprador((s) => (s.hidratado ? s.usuario : null));
  const qtd = useComprador((s) => (s.hidratado ? totalItens(s.itens) : 0));
  return (
    <div className="ml-auto flex items-center gap-1.5">
      {/* Entrar em destaque: botão branco com texto azul (DECIDIDO 18/11/2026) */}
      <Link
        href={usuario ? '/conta' : '/entrar'}
        className="mr-1 hidden min-h-10 items-center gap-1.5 rounded-[10px] bg-branco px-4 text-sm font-semibold text-azul shadow-1 transition-colors hover:bg-azul-nevoa hover:text-azul-escuro lg:inline-flex"
      >
        <Icone nome="user" tamanho="sm" />
        {usuario ? `Olá, ${usuario.nome.split(' ')[0]}` : 'Entrar'}
      </Link>
      <Link href="/conta/favoritos" className="icon-btn text-branco hover:text-branco" aria-label="Favoritos">
        <Icone nome="heart" />
      </Link>
      <Link
        href="/sacola"
        className="icon-btn text-branco hover:text-branco"
        aria-label={`Sacola, ${qtd} itens`}
      >
        <Icone nome="bag" />
        {qtd > 0 && <span className="badge-count">{qtd}</span>}
      </Link>
    </div>
  );
}
