import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Marca } from '@/components/marca/Marca';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import type { Tenant } from '@/types/domain';

/**
 * Páginas de acesso (entrar, criar conta, painel do lojista): página própria, sem
 * cabeçalho, categorias nem rodapé, como nos grandes marketplaces.
 *
 * Fundo: ilustração da cidade (`tenant.fundoAcesso`; em Cianorte, o Portal da Capital do
 * Vestuário e a Catedral ao anoitecer — desenho original, sem fotos de terceiros). No
 * desktop o cartão fica à esquerda e a frase no alto à direita, deixando os marcos à vista.
 * Cidade sem ilustração: fundo marinho da marca.
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
  const fundo = tenant.fundoAcesso;
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-marinho">
      {/* No celular, a ilustração é uma faixa no topo (Portal e Catedral à vista, o cartão
          vem logo abaixo); no desktop ocupa a tela toda, atrás do cartão e da frase. */}
      {fundo && (
        <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-[46vh] lg:inset-0 lg:h-auto">
          <Image
            src={fundo.src}
            alt=""
            fill
            priority
            unoptimized // SVG vetorial: nítido em qualquer tela, sem conversão
            sizes="100vw"
            className="object-cover object-[86%_100%] lg:object-[100%_100%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-marinho/10 via-transparent to-marinho lg:hidden" />
        </div>
      )}
      {/* Véu do desktop: escuro atrás do cartão, aberto sobre a ilustração */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 hidden lg:block lg:bg-gradient-to-r lg:from-marinho/80 lg:via-marinho/25 lg:to-transparent"
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

        <main
          className={`grid flex-1 items-start gap-8 py-6 lg:grid-cols-[480px_minmax(0,1fr)] lg:gap-14 lg:py-10 ${fundo ? 'max-lg:pt-[28vh]' : ''}`}
        >
          <div className="stitch w-full max-w-[480px] justify-self-center rounded-xl bg-branco p-6 shadow-2 [--r:24px] sm:p-8 lg:justify-self-start">
            {children}
          </div>

          <section className="hidden flex-col gap-4 pt-4 text-branco lg:flex" aria-label={titulo}>
            <span className="inline-flex items-center gap-2 self-start rounded-full bg-marinho/60 px-3 py-1.5 text-[13px] font-semibold text-sobre-marinho-forte ring-1 ring-inset ring-branco/20 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-acento" />
              {tenant.slogan}
            </span>
            <p className="m-0 max-w-[560px] font-titulo text-[42px] font-bold leading-[1.05] text-branco [text-shadow:0_2px_16px_rgba(10,20,48,.6)]">
              {titulo}
            </p>
            <p className="m-0 hidden max-w-[480px] text-lg text-sobre-marinho-forte [text-shadow:0_1px_10px_rgba(10,20,48,.7)] [@media(min-height:860px)]:block">
              {apoio}
            </p>
            {/* Em telas baixas (notebook), só o título: o resto cobriria os marcos da ilustração */}
            <ul className="m-0 hidden list-none flex-wrap gap-2 p-0 [@media(min-height:860px)]:flex">
              {destaques.map(([icone, texto]) => (
                <li
                  key={texto}
                  className="inline-flex items-center gap-2 rounded-full bg-marinho/55 py-1.5 pl-1.5 pr-3.5 text-[13px] text-branco ring-1 ring-inset ring-branco/15 backdrop-blur"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-branco/10">
                    <Icone nome={icone} tamanho="sm" />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>
          </section>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-sobre-marinho">
          <span>
            {tenant.marca} · parceria {tenant.associacao}
          </span>
          {fundo && <span>{fundo.legenda}</span>}
        </footer>
      </div>
    </div>
  );
}
