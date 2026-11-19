import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '@/components/marca/Marca';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import type { Tenant } from '@/types/domain';
import fotoCidade from '../../../public/acesso/cianorte.webp';

/**
 * Páginas de acesso (entrar, criar conta, painel do lojista): página própria, sem
 * cabeçalho, categorias nem rodapé, como nos grandes marketplaces. A foto da cidade
 * fica ao fundo com um véu marinho; o formulário vem num cartão por cima.
 *
 * A foto é desta cidade de demonstração (Cianorte vista do alto, domínio público CC0).
 * Com várias cidades, a foto passa a vir do tenant (`GET /v1/tenant`).
 */
export function FundoAcesso({
  tenant,
  titulo,
  apoio,
  destaques,
  children,
}: {
  tenant: Tenant;
  /** Frase grande ao lado do cartão (desktop). */
  titulo: string;
  apoio: string;
  destaques: Array<[NomeIcone, string]>;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-marinho">
      <Image
        src={fotoCidade}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="-z-20 scale-105 object-cover"
      />
      {/* Véu: legível em qualquer tela, mais escuro do lado do texto */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-marinho/35 via-marinho/60 to-marinho/90 lg:bg-gradient-to-r lg:from-marinho/95 lg:via-marinho/75 lg:to-marinho/35"
      />

      <div className="mx-auto flex min-h-dvh w-full max-w-container flex-col px-4 py-5 lg:py-8">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" aria-label={`${tenant.marca} — voltar à página inicial`}>
            <Marca nome={tenant.nome} />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-toque items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-sobre-marinho-forte hover:bg-branco/10 hover:text-branco"
          >
            <Icone nome="chevL" tamanho="sm" />
            Voltar à loja
          </Link>
        </header>

        <main className="grid flex-1 items-center gap-8 py-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-14 lg:py-10">
          <section className="hidden flex-col gap-5 text-branco lg:flex" aria-label={titulo}>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-branco/10 px-3 py-1.5 text-[13px] font-semibold text-sobre-marinho-forte ring-1 ring-inset ring-branco/20">
              <span className="h-2 w-2 rounded-full bg-acento" />
              {tenant.slogan}
            </span>
            <p className="m-0 max-w-[560px] font-titulo text-[44px] font-bold leading-[1.05] text-branco">
              {titulo}
            </p>
            <p className="m-0 max-w-[480px] text-lg text-sobre-marinho-forte">{apoio}</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {destaques.map(([icone, texto]) => (
                <li key={texto} className="flex items-center gap-3 text-[15px] text-branco">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-branco/10 ring-1 ring-inset ring-branco/20">
                    <Icone nome={icone} tamanho="sm" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </section>

          <div className="stitch mx-auto w-full max-w-[480px] rounded-xl bg-branco/95 p-6 shadow-2 backdrop-blur-md [--r:24px] sm:p-8">
            {children}
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-sobre-marinho">
          <span>
            {tenant.marca} · parceria {tenant.associacao}
          </span>
          <span>Foto: {tenant.nome} vista do alto · domínio público (CC0)</span>
        </footer>
      </div>
    </div>
  );
}
