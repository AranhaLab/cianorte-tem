'use client';

import Link from 'next/link';
import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { ArteProduto, capaDe } from '@/components/vitrine/ArteProduto';
import { BarraFreteGratis } from '@/components/vitrine/BarraFreteGratis';
import { GradeCategorias } from '@/components/vitrine/GradeCategorias';
import { useSacolaDetalhada } from '@/hooks/useSacolaDetalhada';
import { reais } from '@/lib/regras/dinheiro';
import { cepAtendido } from '@/lib/regras/frete';
import { useComprador } from '@/stores/comprador';
import type { Categoria } from '@/types/domain';

/** Monta o modal ativo: localização, CEP, categorias ou sacola lateral. */
export function Sheets({ categorias }: { categorias: Categoria[] }) {
  const sheet = useComprador((s) => s.sheet);
  const fechar = useComprador((s) => s.fechar);

  useEffect(() => {
    if (!sheet) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    document.addEventListener('keydown', esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', esc);
      document.body.style.overflow = overflow;
    };
  }, [sheet, fechar]);

  if (sheet === 'local') return <ModalLocal />;
  if (sheet === 'cep') return <ModalCep />;
  if (sheet === 'cats') return <ModalCategorias categorias={categorias} />;
  if (sheet === 'sacola') return <SacolaLateral />;
  return null;
}

/* ---------- Estrutura comum ---------- */

function Fundo({ children, lateral = false }: { children: ReactNode; lateral?: boolean }) {
  const fechar = useComprador((s) => s.fechar);
  return (
    <div
      className={`fixed inset-0 z-[70] flex bg-marinho/50 ${
        lateral ? 'items-end justify-end lg:items-stretch' : 'items-end justify-center lg:items-center'
      }`}
      onClick={(e) => e.target === e.currentTarget && fechar()}
    >
      {children}
    </div>
  );
}

function Folha({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input, select, a, button:not([data-fechar])')?.focus();
  }, []);
  return (
    <Fundo>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="flex max-h-[88vh] w-full max-w-[560px] flex-col gap-3.5 overflow-y-auto rounded-t-[26px] bg-branco px-5 pb-[calc(24px+env(safe-area-inset-bottom))] pt-2.5 lg:rounded-[26px] lg:px-6 lg:py-[22px]"
      >
        <span className="h-[5px] w-10 self-center rounded-full bg-neutro-400 lg:hidden" />
        <div className="flex items-center justify-between">
          <h2>{titulo}</h2>
          <BotaoFechar />
        </div>
        {children}
      </div>
    </Fundo>
  );
}

function BotaoFechar() {
  return (
    <button
      type="button"
      data-fechar
      onClick={() => useComprador.getState().fechar()}
      aria-label="Fechar"
      className="icon-btn text-marinho hover:bg-neutro-200"
    >
      <Icone nome="x" />
    </button>
  );
}

function useAplicarCep() {
  const tenant = useTenant();
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const bruto = String(new FormData(e.currentTarget).get('cep') ?? '').replace(/\D/g, '');
    const { definirCep, avisar } = useComprador.getState();
    if (bruto.length !== 8) return avisar('Digite um CEP com 8 números.');
    const cep = `${bruto.slice(0, 5)}-${bruto.slice(5)}`;
    definirCep(cep);
    avisar(
      cepAtendido(tenant, cep)
        ? `Mostrando ofertas para ${cep}.`
        : 'CEP fora da área atendida. Algumas ofertas ficam indisponíveis.',
    );
  };
}

/* ---------- Modais ---------- */

/** Primeira visita: "Onde você quer receber?" — não bloqueia a navegação (CLAUDE.md §16). */
function ModalLocal() {
  const tenant = useTenant();
  const aplicar = useAplicarCep();
  return (
    <Folha titulo="Onde você quer receber?">
      <span className="text-[13px] text-grafite-2">
        Confirme a cidade e o CEP da sua rua para ver as lojas e os produtos que entregam ou podem ser
        retirados perto de você. Você pode navegar mesmo sem informar.
      </span>
      <form className="flex flex-col gap-3" onSubmit={aplicar}>
        <div className="campo">
          <label htmlFor="cidade-in">Cidade</label>
          <select id="cidade-in" name="cidade" className="input">
            <option>
              {tenant.nome}/{tenant.uf}
            </option>
            <option>Outra cidade</option>
          </select>
        </div>
        <div className="campo">
          <label htmlFor="cep-in">CEP da sua rua</label>
          <input
            id="cep-in"
            name="cep"
            inputMode="numeric"
            placeholder="00000-000"
            autoComplete="postal-code"
            className="input"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg">
          Confirmar localização
        </button>
        <span className="text-xs text-grafite-2">
          Guardamos essa escolha neste aparelho. No cadastro, é só completar o endereço.
        </span>
      </form>
    </Folha>
  );
}

function ModalCep() {
  const tenant = useTenant();
  const cep = useComprador((s) => s.cep ?? tenant.cepPadrao);
  const aplicar = useAplicarCep();
  const faixa = `${tenant.cepsAtendidos[0]?.slice(0, 3) ?? ''}xx-xxx`;
  return (
    <Folha titulo="Onde você está?">
      <span className="text-[13px] text-grafite-2">
        Mostramos as ofertas que entregam ou podem ser retiradas no seu endereço.
      </span>
      <form className="flex items-center gap-2.5" onSubmit={aplicar}>
        <label htmlFor="cep-in" className="sr-only">
          CEP
        </label>
        <input
          id="cep-in"
          name="cep"
          defaultValue={cep}
          inputMode="numeric"
          placeholder="00000-000"
          autoComplete="postal-code"
          className="input flex-1"
        />
        <button type="submit" className="btn btn-primary">
          Usar
        </button>
      </form>
      <span className="text-xs text-grafite-2">
        Atendemos CEPs de {tenant.nome} ({faixa}). Teste com 86000-000 para ver o aviso de fora da área.
      </span>
    </Folha>
  );
}

function ModalCategorias({ categorias }: { categorias: Categoria[] }) {
  return (
    <Folha titulo="Categorias">
      <GradeCategorias categorias={categorias} />
    </Folha>
  );
}

/** Sacola lateral: abre ao adicionar, agrupada por loja, com frete grátis por loja (CLAUDE.md §16). */
function SacolaLateral() {
  const { grupos, subtotal, carregando } = useSacolaDetalhada();
  const ultimo = useComprador((s) => s.ultimoAdicionado);
  const usuario = useComprador((s) => s.usuario);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <Fundo lateral>
      <aside
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Sacola"
        className="flex max-h-[88vh] w-full flex-col gap-3 rounded-t-[26px] bg-branco p-5 pb-[calc(20px+env(safe-area-inset-bottom))] outline-none lg:h-full lg:max-h-none lg:w-[420px] lg:rounded-l-[26px] lg:rounded-r-none"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2">
            <Icone nome="bag" /> Sacola
          </h2>
          <BotaoFechar />
        </div>
        {ultimo && (
          <div className="banner-info bg-verde-claro text-verde-texto">
            <Icone nome="check" />
            <span>
              Adicionado: <b>{ultimo}</b>
            </span>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!carregando && grupos.length === 0 && (
            <span className="text-grafite-2">Sua sacola está vazia.</span>
          )}
          {grupos.map((g) => (
            <div key={g.loja.id} className="flex flex-col gap-2 border-t border-solid border-borda py-3">
              <b className="text-[13px]">{g.loja.nome}</b>
              <BarraFreteGratis loja={g.loja} subtotal={g.subtotal} />
              {g.linhas.map((l) => (
                <div key={l.item.chave} className="flex items-center gap-2.5">
                  <ArteProduto
                    categoria={l.categoria}
                    className="!aspect-square h-[52px] w-[52px] flex-none rounded-[12px]"
                    src={capaDe(l.produto.midias)}
                    sizes="72px"
                    tamanhoIcone="h-1/2 w-1/2"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-[13px]">{l.produto.nome}</span>
                    <span className="text-xs text-grafite-2">
                      {l.item.quantidade} × {reais(l.precoUnitario)}
                      {l.item.opcao ? ` · ${l.item.opcao}` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2.5 border-t border-solid border-borda pt-3.5">
          <div className="flex items-baseline justify-between font-titulo text-[22px] font-bold text-marinho">
            <span>Subtotal</span>
            <span>{reais(subtotal)}</span>
          </div>
          <Link href={usuario ? '/checkout' : '/entrar?next=checkout'} className="btn btn-primary btn-lg">
            Fechar compra
          </Link>
          <Link href="/sacola" className="btn btn-ghost">
            Ver sacola completa
          </Link>
        </div>
      </aside>
    </Fundo>
  );
}
