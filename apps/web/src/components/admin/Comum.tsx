'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Icone } from '@/components/ui/Icone';
import { MOTIVO_MINIMO, motivoValido } from '@/lib/regras/admin';
import { LOJAS_INFO, PEDIDOS_GLOBAIS } from '@/mocks/admin';
import { useAdmin } from '@/stores/admin';
import { useLogos } from '@/stores/logos';
import { useComprador } from '@/stores/comprador';
import { usePainel } from '@/stores/painel';
import type { Categoria, Loja, Selo, StatusCadastroLoja } from '@/types/domain';

export const avisar = (t: string) => useComprador.getState().avisar(t);

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });

/* ---------------- Dados da cidade (vêm do servidor) ---------------- */
interface DadosAdmin {
  lojas: Loja[];
  categorias: Categoria[];
}
const Ctx = createContext<DadosAdmin | null>(null);

export function AdminProvider({ dados, children }: { dados: DadosAdmin; children: ReactNode }) {
  useEffect(() => {
    // O admin decide sobre o que o painel da demo enviou (mesmo navegador).
    void useAdmin.persist.rehydrate();
    void usePainel.persist.rehydrate();
    void useLogos.persist.rehydrate();
  }, []);
  return <Ctx.Provider value={dados}>{children}</Ctx.Provider>;
}

export function useDadosAdmin(): DadosAdmin {
  const d = useContext(Ctx);
  if (!d) throw new Error('useDadosAdmin fora do AdminProvider');
  return d;
}

/** Espera os estados da demo carregarem do aparelho. */
export function AguardaAdmin({ children }: { children: ReactNode }) {
  const a = useAdmin((s) => s.hidratado);
  const p = usePainel((s) => s.hidratado);
  return a && p ? children : <div className="min-h-[40vh]" aria-busy="true" />;
}

export function TituloAdmin({
  titulo,
  apoio,
  acao,
}: {
  titulo: string;
  apoio?: ReactNode;
  acao?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-col gap-0.5">
        <h1>{titulo}</h1>
        {apoio && <span className="text-[13px] text-grafite-2">{apoio}</span>}
      </div>
      {acao}
    </div>
  );
}

/* ---------------- Situação das lojas ---------------- */
/** Status e selo atuais. A loja do painel da demo usa o estado do painel (mesmo navegador). */
export function useSituacaoLojas() {
  const statusLojas = useAdmin((s) => s.statusLojas);
  const selos = useAdmin((s) => s.selos);
  const painelLoja = usePainel((s) => s.lojaId);
  const painelStatus = usePainel((s) => s.status);
  return {
    painelLoja,
    status: (id: string): StatusCadastroLoja =>
      id === painelLoja ? painelStatus : (statusLojas[id] ?? 'aprovada'),
    selo: (l: Loja): Selo => (l.id in selos ? selos[l.id]! : l.selo),
  };
}

export function definirStatusLoja(lojaId: string, status: StatusCadastroLoja) {
  if (lojaId === usePainel.getState().lojaId)
    usePainel.setState(status === 'aprovada' ? { status } : { status, visivel: false });
  else useAdmin.getState().definirStatusLoja(lojaId, status);
}

export const docsDe = (lojaId: string) =>
  LOJAS_INFO[lojaId]?.documentos ?? {
    cartaoCnpj: false,
    contratoSocial: false,
    registroMarca: false,
    contratoAceito: false,
  };

/** Pendências para o menu e a visão geral. */
export function usePendencias() {
  const candidatas = useAdmin((s) => s.candidatas);
  const fila = useAdmin((s) => s.fila);
  const analises = useAdmin((s) => s.analises);
  const status = usePainel((s) => s.status);
  const edicoes = usePainel((s) => s.edicoes);
  const filiais = usePainel((s) => s.filiais);
  const cadastros = candidatas.filter((c) => !c.decisao).length + (status === 'em_analise' ? 1 : 0);
  const campanhas = usePainel((s) => s.campanhas);
  const produtos =
    fila.filter((c) => !c.decisao).length +
    Object.values(edicoes).filter((e) => e.emAnalise).length +
    campanhas.filter((c) => c.status === 'arte_em_analise').length; // artes de anúncio
  return {
    cadastros,
    filiais: filiais.filter((f) => f.status === 'em_analise').length,
    produtos,
    pedidos: Object.keys(analises).filter((id) => PEDIDOS_GLOBAIS.some((p) => p.id === id)).length,
  };
}

/* ---------------- Ação com motivo ---------------- */
/**
 * Botão que, ao confirmar, exige um motivo (vai para a auditoria). Usado em toda
 * decisão que nega, bloqueia, revoga ou muda regra.
 */
export function AcaoComMotivo({
  rotulo,
  confirmar,
  onConfirmar,
  perigo = false,
  ajuda,
  classe = 'btn btn-sm btn-ghost',
}: {
  rotulo: string;
  confirmar: string;
  onConfirmar: (motivo: string) => void;
  perigo?: boolean;
  ajuda?: string;
  classe?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [tentou, setTentou] = useState(false);
  const id = useId();
  const campo = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (aberto) campo.current?.focus();
  }, [aberto]);

  if (!aberto)
    return (
      <button type="button" className={classe} onClick={() => setAberto(true)}>
        {rotulo}
      </button>
    );
  const invalido = tentou && !motivoValido(motivo);
  return (
    <div className="flex w-full flex-col gap-2 rounded-[14px] bg-linho p-3" role="group" aria-label={rotulo}>
      <label htmlFor={id} className="rotulo">
        Motivo (fica na auditoria{ajuda ? `; ${ajuda}` : ''})
      </label>
      <textarea
        id={id}
        ref={campo}
        className="input min-h-20 resize-y py-2.5 text-sm"
        maxLength={500}
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        aria-invalid={invalido || undefined}
        aria-describedby={invalido ? `${id}-erro` : undefined}
      />
      {invalido && (
        <span id={`${id}-erro`} className="erro-campo">
          Escreva pelo menos {MOTIVO_MINIMO} caracteres.
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setAberto(false)}>
          Cancelar
        </button>
        <button
          type="button"
          className={`btn btn-sm ${perigo ? 'bg-acento text-branco hover:bg-acento-escuro' : 'btn-primary'}`}
          onClick={() => {
            setTentou(true);
            if (!motivoValido(motivo)) return;
            onConfirmar(motivo.trim());
            setAberto(false);
            setMotivo('');
            setTentou(false);
          }}
        >
          {confirmar}
        </button>
      </div>
    </div>
  );
}

export function Kpi({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className={`kpi ${destaque ? 'border-marinho bg-marinho text-sobre-marinho' : ''}`}>
      <span className="text-[13px]">{rotulo}</span>
      <span className={`kpi-valor ${destaque ? 'text-branco' : ''}`}>{valor}</span>
    </div>
  );
}

export function AvisoDemo() {
  return (
    <div className="banner-info bg-azul-nevoa text-azul-escuro">
      <Icone nome="shield" />
      <span className="text-[13px]">
        Área administrativa da demonstração. Na versão real, só o papel <b>admin</b> entra (sessão validada no
        servidor) e cada ação é registrada na auditoria.
      </span>
    </div>
  );
}
