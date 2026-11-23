'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { StatusDisponibilidade } from '@/components/ui/Basicos';
import { disponibilidadePublica } from '@/lib/regras/disponibilidade';
import { lerCsvEstoque } from '@/lib/regras/csvEstoque';
import { rascunhoDeProduto, saldoTotal, type RascunhoProduto } from '@/lib/regras/produto';
import { usePainel } from '@/stores/painel';
import type { ModoSincronizacao } from '@/types/domain';
import { TituloPainel, avisar } from './Comum';
import { useLojaPainel } from './PainelContexto';

const inteiro = (v: number) => Number.isSafeInteger(v) && v >= 0;

export function GestaoEstoque() {
  const { produtos } = useLojaPainel();
  const estoque = usePainel((s) => s.estoque);
  const edicoes = usePainel((s) => s.edicoes);
  const api = usePainel((s) => s.integracao);
  const { definirModoSync, definirReserva, atualizarEstoque } = usePainel.getState();
  const [editando, setEditando] = useState<RascunhoProduto | null>(null);
  const [pausado, setPausado] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');

  const rascunhos = estoque.flatMap((item) => {
    const p = produtos.find((produto) => produto.id === item.produtoId);
    const r = edicoes[item.produtoId]?.atual ?? (p ? rascunhoDeProduto(p, item) : null);
    return r ? [r] : [];
  });
  const linhas = rascunhos.flatMap((r) =>
    r.tipo === 'variacoes' && r.variacao
      ? r.variacao.opcoes.map((o) => ({ sku: o.sku, quantidade: o.saldo, produto: r.nome }))
      : [{ sku: r.sku, quantidade: r.saldo, produto: r.nome }],
  );

  function salvarManual(e: FormEvent) {
    e.preventDefault();
    if (
      !editando ||
      !inteiro(editando.minimo) ||
      !inteiro(editando.saldo) ||
      editando.variacao?.opcoes.some((o) => !inteiro(o.saldo))
    ) {
      setErro('Informe quantidades inteiras e não negativas.');
      return;
    }
    atualizarEstoque(editando, pausado);
    setEditando(null);
    setErro('');
    avisar('Estoque atualizado.');
  }

  async function importar(e: FormEvent) {
    e.preventDefault();
    setErro('');
    setMensagem('');
    if (!arquivo) {
      setErro('Selecione um arquivo CSV.');
      return;
    }
    try {
      const dados = lerCsvEstoque(await arquivo.text());
      const mapa = new Map(linhas.map((l) => [l.sku.toUpperCase(), l]));
      if (mapa.size !== linhas.length)
        throw new Error('Há SKUs repetidos no estoque. Corrija os produtos antes de importar.');
      const desconhecido = dados.find((d) => !mapa.has(d.sku.toUpperCase()));
      if (desconhecido)
        throw new Error(`SKU não encontrado: ${desconhecido.sku}. Nenhuma alteração foi aplicada.`);
      const valores = new Map(dados.map((d) => [d.sku.toUpperCase(), d.quantidade]));
      for (const r of rascunhos) {
        if (r.tipo === 'variacoes' && r.variacao) {
          if (!r.variacao.opcoes.some((o) => valores.has(o.sku.toUpperCase()))) continue;
          atualizarEstoque({
            ...r,
            variacao: {
              ...r.variacao,
              opcoes: r.variacao.opcoes.map((o) => ({
                ...o,
                saldo: valores.get(o.sku.toUpperCase()) ?? o.saldo,
              })),
            },
          });
        } else if (valores.has(r.sku.toUpperCase()))
          atualizarEstoque({ ...r, saldo: valores.get(r.sku.toUpperCase())! });
      }
      setMensagem(
        `${dados.length} ${dados.length === 1 ? 'SKU atualizado' : 'SKUs atualizados'} com sucesso.`,
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
    }
  }

  function exportar() {
    const escapar = (valor: string) => `"${valor.replace(/"/g, '""')}"`;
    const csv =
      '\uFEFFsku;quantidade;produto\r\n' +
      linhas.map((l) => `${escapar(l.sku)};${l.quantidade};${escapar(l.produto)}`).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estoque.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <TituloPainel
        titulo="Estoque e integração"
        apoio="O comprador vê a disponibilidade, sem acesso às quantidades."
        acao={
          <Link href="/painel/produtos/novo" className="btn btn-primary">
            Adicionar produto
          </Link>
        }
      />
      <div className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h2>Como seu estoque é atualizado</h2>
          <div className="segmentado" role="group" aria-label="Modo de sincronização">
            {(
              [
                ['manual', 'Manual'],
                ['planilha', 'Planilha'],
                ['api', 'API aberta'],
              ] as Array<[ModoSincronizacao, string]>
            ).map(([m, nome]) => (
              <button
                key={m}
                type="button"
                aria-pressed={api.modo === m}
                onClick={() => {
                  definirModoSync(m);
                  setErro('');
                  setMensagem('');
                  setEditando(null);
                }}
              >
                {nome}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-grafite-2">
          {api.modo === 'manual'
            ? 'Ajuste as quantidades após vendas ou entradas no balcão.'
            : api.modo === 'planilha'
              ? 'Importe quantidades por SKU usando um arquivo CSV.'
              : 'Configuração demonstrativa para integração com o sistema da loja.'}
        </p>
        <div className="campo max-w-[280px]">
          <label htmlFor="reserva">Reserva de segurança por produto</label>
          <input
            id="reserva"
            className="input"
            type="number"
            min={0}
            value={api.reservaSeguranca}
            onChange={(e) => definirReserva(Number(e.target.value))}
            aria-describedby="h-reserva"
          />
          <span id="h-reserva" className="dica">
            Unidades guardadas para o balcão. O marketplace só vende o que passar disso.
          </span>
        </div>
      </div>
      {api.modo === 'planilha' && (
        <form className="card flex flex-col gap-3" onSubmit={importar}>
          <h2>Importar estoque por planilha</h2>
          <p className="text-sm text-grafite-2">
            Use as colunas sku e quantidade, separadas por ponto e vírgula ou vírgula. Produtos com variações
            usam o SKU de cada opção. A quantidade substitui o saldo atual; SKUs não encontrados impedem a
            importação.
          </p>
          <div className="campo">
            <label htmlFor="arquivo-estoque">Arquivo CSV</label>
            <input
              id="arquivo-estoque"
              className="input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                setArquivo(e.target.files?.[0] ?? null);
                setErro('');
                setMensagem('');
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="submit">
              Importar CSV
            </button>
            <button className="btn btn-ghost" type="button" onClick={exportar}>
              Exportar planilha de estoque
            </button>
          </div>
          {mensagem && (
            <p role="status" className="text-verde-texto">
              {mensagem}
            </p>
          )}
        </form>
      )}
      {erro && (
        <p role="alert" className="text-acento">
          {erro}
        </p>
      )}
      {editando && api.modo === 'manual' && (
        <form className="card flex flex-col gap-3" onSubmit={salvarManual}>
          <h2>Ajustar estoque: {editando.nome}</h2>
          <p className="text-sm text-grafite-2">
            Altere o saldo para adicionar ou retirar unidades. A disponibilidade é calculada pelo saldo e pela
            reserva.
          </p>
          {editando.tipo === 'variacoes' && editando.variacao ? (
            editando.variacao.opcoes.map((o, i) => (
              <div className="campo max-w-[280px]" key={o.sku}>
                <label htmlFor={`saldo-${i}`}>
                  {o.nome} · SKU {o.sku}
                </label>
                <input
                  id={`saldo-${i}`}
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={o.saldo}
                  onChange={(e) =>
                    setEditando({
                      ...editando,
                      variacao: {
                        ...editando.variacao!,
                        opcoes: editando.variacao!.opcoes.map((v, j) =>
                          j === i ? { ...v, saldo: e.target.value === '' ? -1 : Number(e.target.value) } : v,
                        ),
                      },
                    })
                  }
                />
              </div>
            ))
          ) : (
            <div className="campo max-w-[280px]">
              <label htmlFor="saldo-manual">Quantidade atual</label>
              <input
                id="saldo-manual"
                className="input"
                type="number"
                min={0}
                step={1}
                required
                value={editando.saldo}
                onChange={(e) =>
                  setEditando({ ...editando, saldo: e.target.value === '' ? -1 : Number(e.target.value) })
                }
              />
            </div>
          )}
          <div className="campo max-w-[280px]">
            <label htmlFor="minimo-manual">Estoque mínimo</label>
            <input
              id="minimo-manual"
              className="input"
              type="number"
              min={0}
              step={1}
              required
              value={editando.minimo}
              onChange={(e) =>
                setEditando({ ...editando, minimo: e.target.value === '' ? -1 : Number(e.target.value) })
              }
            />
          </div>
          <div className="campo max-w-[280px]">
            <label htmlFor="status-manual">Disponibilidade</label>
            <select
              id="status-manual"
              className="input"
              value={pausado ? 'pausado' : 'automatico'}
              onChange={(e) => setPausado(e.target.value === 'pausado')}
            >
              <option value="automatico">Automática pelo estoque</option>
              <option value="pausado">Indisponível (venda pausada)</option>
            </select>
            <span className="dica">Ao retomar, a disponibilidade depende do saldo e da reserva.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn btn-primary">
              Salvar estoque
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setEditando({
                  ...editando,
                  saldo: 0,
                  variacao: editando.variacao
                    ? {
                        ...editando.variacao,
                        opcoes: editando.variacao.opcoes.map((o) => ({ ...o, saldo: 0 })),
                      }
                    : null,
                })
              }
            >
              Zerar quantidades
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditando(null);
                setErro('');
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      <div
        className="tabela-wrap"
        tabIndex={0}
        role="region"
        aria-label="Tabela de estoque (role para os lados no celular)"
      >
        <table className="tabela">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Saldo</th>
              <th>Mínimo</th>
              <th>Comprador vê</th>
              {api.modo === 'manual' && (
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rascunhos.map((r) => (
              <tr key={r.id}>
                <td>
                  <b className="font-semibold">{r.nome}</b>
                  <br />
                  <span className="text-xs text-grafite-2">SKU {r.sku}</span>
                </td>
                <td>
                  <b>{saldoTotal(r)}</b> un.
                </td>
                <td>{r.minimo}</td>
                <td>
                  <StatusDisponibilidade
                    disp={
                      estoque.find((e) => e.produtoId === r.id)?.indisponivelManual
                        ? 'indisponivel'
                        : disponibilidadePublica({
                            saldo: saldoTotal(r),
                            reservaSeguranca: api.reservaSeguranca,
                            minimo: r.minimo,
                          })
                    }
                  />
                </td>
                {api.modo === 'manual' && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost min-h-toque"
                      onClick={() => {
                        setEditando(structuredClone(r));
                        setPausado(!!estoque.find((e) => e.produtoId === r.id)?.indisponivelManual);
                        setErro('');
                      }}
                    >
                      Ajustar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {api.modo === 'api' && (
        <div className="card flex flex-col gap-3" id="api">
          <h2>API aberta de estoque</h2>
          <p className="text-sm text-grafite-2">
            A integração ainda é demonstrativa; nenhuma sincronização externa é realizada.
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="campo">
              <span className="rotulo">Chave da API (exemplo)</span>
              <span className="tecla">{api.chaveMascarada}</span>
            </div>
            <div className="campo">
              <label htmlFor="wh">Webhook de pedidos (exemplo)</label>
              <input
                id="wh"
                className="input"
                placeholder="https://sua-loja.com.br/webhooks/pedidos"
                disabled
              />
              <span className="dica">Disponível quando a integração for implementada.</span>
            </div>
          </div>
          <pre className="codigo m-0">
            {
              'PUT /v1/lojas/{lojaId}/estoque/{sku}\nAuthorization: Bearer <chave>\n{ "saldo": 42 }\n\nPOST /v1/lojas/{lojaId}/estoque/lote\n{ "itens": [{ "sku": "VA-CSL-001", "saldo": 42 }] }\n\nGET /v1/lojas/{lojaId}/estoque/{sku}/reservas'
            }
          </pre>
        </div>
      )}
    </>
  );
}
