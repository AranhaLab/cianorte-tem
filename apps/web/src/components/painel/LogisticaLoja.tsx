'use client';

import { useState, type FormEvent } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { MODO_DEMO } from '@/lib/demo';
import { paraCentavos, reais } from '@/lib/regras/dinheiro';
import { FRETE_MINIMO } from '@/lib/regras/frete';
import {
  DISTANCIA_MAX_LIMITE,
  errosLogistica,
  simularTrajeto,
  type LogisticaLoja as Logistica,
  type ResultadoTrajeto,
} from '@/lib/regras/logistica';
import { usePainel } from '@/stores/painel';
import type { Loja, StatusCadastroLoja } from '@/types/domain';
import { avisar } from './Comum';

const emReais = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ','));

/** Padrão a partir da loja: distância máxima de 10 km [PROPOSTA] e corte às 15h (§7.4). */
export const logisticaPadrao = (loja: Loja): Logistica => ({
  entrega: loja.entrega,
  tarifaKmCentavos: loja.tarifaKmCentavos,
  distanciaMaxKm: 10,
  freteGratisAPartirDe: loja.freteGratisAPartirDe,
  corte: '15:00',
  retirada: loja.retirada,
});

const MOTIVO: Record<Exclude<ResultadoTrajeto, { atendido: true }>['motivo'], string> = {
  cep_invalido: 'Digite um CEP com 8 dígitos.',
  fora_da_cidade: 'Este CEP fica fora da área atendida pela cidade.',
  sem_entrega: 'A loja não oferece entrega. O comprador pode retirar na loja.',
  distancia: 'Fora da sua distância máxima de entrega.',
};

/** Entrega, retirada e trajeto de teste (CLAUDE.md §5.2, §7.4 e §16). No back-end: PATCH /v1/painel/loja. */
export function LogisticaLoja({ loja }: { loja: Loja }) {
  const tenant = useTenant();
  const salva = usePainel((s) => s.logistica) ?? logisticaPadrao(loja);
  const [l, setL] = useState<Logistica>(salva);
  const [tarifa, setTarifa] = useState(emReais(salva.tarifaKmCentavos));
  const [gratis, setGratis] = useState(emReais(salva.freteGratisAPartirDe));
  const [tentou, setTentou] = useState(false);
  const [cep, setCep] = useState('');
  const [teste, setTeste] = useState<ResultadoTrajeto | null>(null);
  const muda = (x: Partial<Logistica>) => setL((a) => ({ ...a, ...x }));

  const erros = errosLogistica(l);
  const vis = tentou ? erros : {};
  const corteMudou = l.corte !== salva.corte;
  const props = (c: string, ajuda?: string) => ({
    'aria-invalid': vis[c] ? true : undefined,
    'aria-describedby': [vis[c] ? `lg-erro-${c}` : null, ajuda].filter(Boolean).join(' ') || undefined,
  });
  const erro = (c: string) =>
    vis[c] ? (
      <span id={`lg-erro-${c}`} className="erro-campo">
        {vis[c]}
      </span>
    ) : null;

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (Object.keys(erros).length) return avisar('Confira os campos destacados.');
    usePainel.getState().salvarLogistica(l);
    avisar(corteMudou ? 'Logística salva. O novo corte vale para as próximas compras.' : 'Logística salva.');
  };

  return (
    <form
      method="post"
      noValidate
      onSubmit={salvar}
      className="card flex flex-col gap-3"
      aria-label="Entrega e retirada"
    >
      <h2>Entrega e retirada</h2>
      <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
        <legend className="sr-only">Modos de atendimento</legend>
        <label className="flex min-h-toque items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={l.entrega}
            onChange={(e) => muda({ entrega: e.target.checked })}
            className="mt-px h-5 w-5 flex-none accent-azul"
          />
          Entregar no endereço do comprador
        </label>
        <label className="flex min-h-toque items-start gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={l.retirada}
            onChange={(e) => muda({ retirada: e.target.checked })}
            className="mt-px h-5 w-5 flex-none accent-azul"
          />
          Oferecer retirada na loja, grátis (só para compradores de {tenant.nome}, sem limite de km)
        </label>
        {erro('modos')}
      </fieldset>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {l.entrega && (
          <>
            <div className="campo">
              <label htmlFor="lg-tarifa">Tarifa por km (R$)</label>
              <input
                id="lg-tarifa"
                className="input"
                inputMode="decimal"
                value={tarifa}
                onChange={(e) => {
                  setTarifa(e.target.value);
                  muda({ tarifaKmCentavos: paraCentavos(e.target.value) });
                }}
                {...props('tarifa', 'lg-h-tarifa')}
              />
              <span id="lg-h-tarifa" className="dica">
                Frete = distância pelas ruas × tarifa, com mínimo de {reais(FRETE_MINIMO)}.
              </span>
              {erro('tarifa')}
            </div>
            <div className="campo">
              <label htmlFor="lg-dist">Distância máxima de entrega (km)</label>
              <input
                id="lg-dist"
                className="input"
                type="number"
                min={1}
                max={DISTANCIA_MAX_LIMITE}
                step={0.5}
                value={Number.isFinite(l.distanciaMaxKm) ? l.distanciaMaxKm : ''}
                onChange={(e) => muda({ distanciaMaxKm: Number(e.target.value) })}
                {...props('distancia', 'lg-h-dist')}
              />
              <span id="lg-h-dist" className="dica">
                Medida pela rota, da loja até o comprador. Ampliar a entrega não amplia a retirada.
              </span>
              {erro('distancia')}
            </div>
            <div className="campo">
              <label htmlFor="lg-gratis">Frete grátis a partir de (R$, opcional)</label>
              <input
                id="lg-gratis"
                className="input"
                inputMode="decimal"
                value={gratis}
                onChange={(e) => {
                  setGratis(e.target.value);
                  muda({ freteGratisAPartirDe: e.target.value.trim() ? paraCentavos(e.target.value) : null });
                }}
                {...props('freteGratis', 'lg-h-gratis')}
              />
              <span id="lg-h-gratis" className="dica">
                Vale para o subtotal da sua loja. O frete grátis é custeado pela loja.
              </span>
              {erro('freteGratis')}
            </div>
          </>
        )}
        <div className="campo">
          <label htmlFor="lg-corte">Horário de corte</label>
          <input
            id="lg-corte"
            className="input"
            type="time"
            value={l.corte}
            onChange={(e) => muda({ corte: e.target.value })}
            {...props('corte', 'lg-h-corte')}
          />
          <span id="lg-h-corte" className="dica">
            Pedidos pagos até o corte saem no mesmo dia. Mudar o corte não altera pedidos já feitos.
          </span>
          {erro('corte')}
        </div>
      </div>

      <button type="submit" className="btn btn-primary self-start">
        Salvar logística
      </button>

      {/* ---------- Trajeto de teste ---------- */}
      <div className="flex flex-col gap-2.5 border-t border-solid border-borda pt-3">
        <h3 className="text-base">Trajeto de teste</h3>
        <span className="text-[13px] text-grafite-2">
          Confira frete e prazo para um CEP com a configuração acima, antes de salvar.
        </span>
        <div className="flex flex-wrap items-end gap-2">
          <div className="campo flex-1">
            <label htmlFor="lg-cep">CEP do comprador</label>
            <input
              id="lg-cep"
              className="input"
              inputMode="numeric"
              autoComplete="off"
              placeholder={tenant.cepPadrao}
              value={cep}
              onChange={(e) => setCep(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setTeste(simularTrajeto(l, tenant, cep))}
          >
            <Icone nome="truck" tamanho="sm" />
            Simular
          </button>
        </div>
        <div aria-live="polite">
          {teste &&
            (teste.atendido ? (
              <div className="banner-info bg-verde-claro text-verde-texto">
                <Icone nome="check" />
                <span className="flex flex-col gap-0.5 text-[13px]">
                  <b>
                    {teste.distanciaKm.toFixed(1).replace('.', ',')} km · frete {reais(teste.freteCentavos)}
                  </b>
                  <span>
                    {teste.previsao === 'hoje' ? 'Pago agora, sai hoje' : 'Pago agora, sai amanhã'} (corte{' '}
                    {l.corte})
                    {teste.gratisAcima !== null
                      ? ` · grátis em compras a partir de ${reais(teste.gratisAcima)}`
                      : ''}
                    .
                  </span>
                  <span className="opacity-90">
                    Distância de demonstração; a versão real usa a rota pelas ruas.
                  </span>
                </span>
              </div>
            ) : (
              <div className="banner-info bg-aviso-claro text-aviso-texto">
                <Icone nome="alert" />
                <span className="text-[13px]">
                  {MOTIVO[teste.motivo]}
                  {teste.distanciaKm !== null &&
                    ` (${teste.distanciaKm.toFixed(1).replace('.', ',')} km; máximo ${l.distanciaMaxKm} km)`}
                </span>
              </div>
            ))}
        </div>
      </div>
    </form>
  );
}

const ROTULO_STATUS: Record<StatusCadastroLoja, [string, string]> = {
  rascunho: ['Rascunho', 'st-gray'],
  em_analise: ['Em análise', 'st-amber'],
  aprovada: ['Aprovada', 'st-green'],
  reprovada: ['Reprovada', 'st-red'],
  suspensa: ['Suspensa', 'st-red'],
};

/** Unidades/filiais (PRD-02): cada uma com cadastro e aprovação próprios; não aprovada não vende. */
export function UnidadesLoja({ loja }: { loja: Loja }) {
  const filiais = usePainel((s) => s.filiais);
  const [aberto, setAberto] = useState(false);
  const [f, setF] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    cep: '',
    horario: 'Seg a sáb, 8h às 18h',
  });
  const [tentou, setTentou] = useState(false);
  const faltando = (['nome', 'endereco', 'bairro', 'cep'] as const).filter((k) =>
    k === 'cep' ? f.cep.replace(/\D/g, '').length !== 8 : !f[k].trim(),
  );

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    if (faltando.length) return avisar('Preencha nome, endereço, bairro e CEP da unidade.');
    usePainel.getState().adicionarFilial(f);
    avisar('Unidade enviada para análise. Ela só vende depois de aprovada.');
    setAberto(false);
    setTentou(false);
    setF({ nome: '', endereco: '', bairro: '', cep: '', horario: 'Seg a sáb, 8h às 18h' });
  };

  const campo = (k: keyof typeof f, rotulo: string, extra: Record<string, unknown> = {}) => (
    <div className="campo">
      <label htmlFor={`un-${k}`}>{rotulo}</label>
      <input
        id={`un-${k}`}
        className="input"
        value={f[k]}
        onChange={(e) => setF((a) => ({ ...a, [k]: e.target.value }))}
        aria-invalid={tentou && (faltando as string[]).includes(k) ? true : undefined}
        {...extra}
      />
    </div>
  );

  return (
    <section className="card flex flex-col gap-3" aria-label="Unidades">
      <h2>Unidades</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        <li className="flex flex-wrap items-center justify-between gap-2.5">
          <span className="flex flex-col">
            <b className="text-sm">{loja.nome} — matriz</b>
            <span className="text-xs text-grafite-2">{loja.bairro}</span>
          </span>
          <span className="status st-green">Aprovada</span>
        </li>
        {filiais.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2.5 border-t border-solid border-borda pt-2"
          >
            <span className="flex flex-col">
              <b className="text-sm">{u.nome}</b>
              <span className="text-xs text-grafite-2">
                {u.endereco} · {u.bairro} · {u.horario}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className={`status ${ROTULO_STATUS[u.status][1]}`}>{ROTULO_STATUS[u.status][0]}</span>
              {MODO_DEMO && u.status === 'em_analise' && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() => usePainel.getState().aprovarFilial(u.id)}
                >
                  Simular aprovação
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {aberto ? (
        <form
          method="post"
          noValidate
          onSubmit={enviar}
          className="flex flex-col gap-3 rounded-[14px] bg-linho p-3.5"
          aria-label="Nova unidade"
        >
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {campo('nome', 'Nome da unidade')}
            {campo('cep', 'CEP', { inputMode: 'numeric', autoComplete: 'postal-code' })}
            {campo('endereco', 'Endereço (rua e número)', { autoComplete: 'address-line1' })}
            {campo('bairro', 'Bairro')}
            {campo('horario', 'Horário de funcionamento')}
          </div>
          <span className="dica">
            A unidade tem cadastro e aprovação próprios. Enquanto estiver em análise, ela não vende.
          </span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Enviar para análise
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-sm min-h-toque self-start"
          onClick={() => setAberto(true)}
        >
          <Icone nome="plus" tamanho="sm" />
          Adicionar filial
        </button>
      )}
    </section>
  );
}
