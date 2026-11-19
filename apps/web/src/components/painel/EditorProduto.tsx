'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { ArteProduto } from '@/components/vitrine/ArteProduto';
import { MODO_DEMO } from '@/lib/demo';
import { desconto, paraCentavos, reais } from '@/lib/regras/dinheiro';
import { disponibilidadePublica, ROTULO_DISPONIBILIDADE } from '@/lib/regras/disponibilidade';
import { MAX_MIDIAS } from '@/lib/regras/kits';
import { tamanhoLegivel } from '@/lib/regras/posVenda';
import {
  classificarMidia,
  errosProduto,
  formatoDigital,
  gtinValido,
  mover,
  posicaoPreco,
  rascunhoDeProduto,
  rotuloCampo,
  saldoTotal,
  separarAlteracoes,
  type RascunhoProduto,
  type TipoProduto,
} from '@/lib/regras/produto';
import { usePainel } from '@/stores/painel';
import type { Kit } from '@/types/domain';
import { AguardaPainel, avisar, TituloPainel } from './Comum';
import { useLojaPainel } from './PainelContexto';

/** Faixa de ofertas equivalentes (mesmo GTIN) no marketplace — exemplo fixo da demo (CLAUDE.md §16). */
const FAIXA_EQUIVALENTES: [number, number] = [8490, 9990];
const MAX_CARACTERISTICAS = 10;
const MAX_DESCRICAO = 2000;

const TIPOS: Array<[TipoProduto, string, string]> = [
  ['simples', 'Simples', 'Um item, um SKU'],
  ['variacoes', 'Com variações', 'Tamanho, cor… cada opção com SKU e estoque'],
  ['kit', 'Kit', '2 ou mais produtos da loja'],
  ['digital', 'Digital', 'Download (PDF, EPUB ou ZIP)'],
];

/** Só guarda o que vale para o tipo escolhido (troca de tipo não deixa resto). */
const normalizar = (r: RascunhoProduto): RascunhoProduto => ({
  ...r,
  variacao: r.tipo === 'variacoes' ? r.variacao : null,
  kit: r.tipo === 'kit' ? r.kit : null,
  digital: r.tipo === 'digital' ? r.digital : null,
  saldo: r.tipo === 'simples' ? r.saldo : r.tipo === 'variacoes' ? saldoTotal(r) : 0,
});

const emReais = (c: number | null) =>
  c === null || !Number.isFinite(c) ? '' : (c / 100).toFixed(2).replace('.', ',');

/** Editor de produto completo: novo (`produtoId` vazio) ou edição. No back-end: POST/PATCH /v1/painel/produtos. */
export function EditorProduto({ produtoId }: { produtoId?: string }) {
  return (
    <AguardaPainel>
      <Carregar produtoId={produtoId} />
    </AguardaPainel>
  );
}

function Carregar({ produtoId }: { produtoId?: string }) {
  const { loja, produtos } = useLojaPainel();
  const edicao = usePainel((s) => (produtoId ? s.edicoes[produtoId] : undefined));
  const estoque = usePainel((s) => s.estoque);

  if (!produtoId) {
    const vazio: RascunhoProduto = {
      id: null,
      nome: '',
      descricao: '',
      categoriaId: loja.categoriaId,
      subcategoriaId: null,
      marca: '',
      caracteristicas: [],
      tipo: 'simples',
      precoCentavos: NaN,
      precoDeCentavos: null,
      sku: '',
      gtin: '',
      saldo: 0,
      minimo: 0,
      variacao: null,
      kit: null,
      digital: null,
      midias: [],
    };
    return <Formulario publicado={null} inicial={vazio} />;
  }
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto && !edicao)
    return (
      <CaixaVazia
        icone="box"
        titulo="Produto não encontrado"
        texto="Ele não existe ou não é da sua loja."
        acao={
          <Link href="/painel/produtos" className="btn btn-primary">
            Ver produtos
          </Link>
        }
      />
    );
  const publicado =
    edicao?.atual ??
    rascunhoDeProduto(
      produto!,
      estoque.find((e) => e.produtoId === produtoId),
    );
  return (
    <Formulario
      key={produtoId}
      publicado={publicado}
      inicial={edicao?.emAnalise ?? publicado}
      pendentes={edicao?.pendentes ?? []}
      novo={edicao?.novo ?? false}
      reprovacao={edicao?.reprovacao}
    />
  );
}

function Formulario({
  publicado,
  inicial,
  pendentes = [],
  novo = false,
  reprovacao,
}: {
  publicado: RascunhoProduto | null;
  inicial: RascunhoProduto;
  pendentes?: string[];
  novo?: boolean;
  reprovacao?: string;
}) {
  const router = useRouter();
  const { loja, produtos, categorias } = useLojaPainel();
  const estoque = usePainel((s) => s.estoque);
  const edicoes = usePainel((s) => s.edicoes);
  const reserva = usePainel((s) => s.integracao.reservaSeguranca);

  const [r, setR] = useState<RascunhoProduto>(inicial);
  const [precoTxt, setPrecoTxt] = useState(emReais(inicial.precoCentavos));
  const [precoDeTxt, setPrecoDeTxt] = useState(emReais(inicial.precoDeCentavos));
  const [novaCarac, setNovaCarac] = useState('');
  const [tentou, setTentou] = useState(false);
  const fotos = useRef<HTMLInputElement>(null);
  const arquivoDigital = useRef<HTMLInputElement>(null);
  const muda = (x: Partial<RascunhoProduto>) => setR((a) => ({ ...a, ...x }));

  const categoria = categorias.find((c) => c.id === r.categoriaId) ?? categorias[0]!;
  // Componentes possíveis de kit: produtos físicos da própria loja que não são kits.
  const paraKit = produtos.filter((p) => p.lojaId === loja.id && !p.kit && !p.digital && p.id !== r.id);

  const skusDaLoja = useMemo(() => {
    const s = estoque.filter((e) => e.produtoId !== r.id).map((e) => e.sku);
    for (const [id, e] of Object.entries(edicoes))
      if (id !== r.id) {
        s.push(e.atual.sku);
        e.atual.variacao?.opcoes.forEach((o) => s.push(o.sku));
      }
    return s;
  }, [estoque, edicoes, r.id]);

  const n = normalizar(r);
  const erros = errosProduto(n, { lojaId: loja.id, produtosDaLoja: produtos, skusDaLoja });
  const visiveis = tentou ? erros : {};
  const alteracoes = publicado && !novo ? separarAlteracoes(publicado, n) : null;

  const erro = (campo: string) =>
    visiveis[campo] ? (
      <span id={`erro-${campo}`} className="erro-campo">
        {visiveis[campo]}
      </span>
    ) : null;
  const inv = (campo: string, ajuda?: string) => ({
    'aria-invalid': visiveis[campo] ? true : undefined,
    'aria-describedby':
      [visiveis[campo] ? `erro-${campo}` : null, ajuda].filter(Boolean).join(' ') || undefined,
  });

  const mudarTipo = (tipo: TipoProduto) =>
    muda({
      tipo,
      variacao: tipo === 'variacoes' ? (r.variacao ?? { nome: 'Tamanho', opcoes: [] }) : r.variacao,
      kit:
        tipo === 'kit'
          ? (r.kit ?? {
              tipo: 'fechado',
              componentes: [],
              minimoItens: 2,
              maximoItens: 2,
              descontoPercentual: 0,
            })
          : r.kit,
    });

  const addMidias = (e: ChangeEvent<HTMLInputElement>) => {
    const arquivos = [...(e.target.files ?? [])];
    e.target.value = '';
    const novas: RascunhoProduto['midias'] = [];
    for (const f of arquivos) {
      const c = classificarMidia(f);
      if ('erro' in c) {
        avisar(`${f.name}: ${c.erro}`);
        continue;
      }
      if (r.midias.length + novas.length >= MAX_MIDIAS) {
        avisar(`No máximo ${MAX_MIDIAS} fotos e vídeos.`);
        break;
      }
      novas.push({
        id: crypto.randomUUID(),
        tipo: c.tipo,
        legenda: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        variante: (r.midias.length + novas.length) % 6,
        nomeArquivo: f.name,
      });
    }
    if (novas.length) muda({ midias: [...r.midias, ...novas] });
  };

  const escolherDigital = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const formato = formatoDigital(f);
    if (typeof formato !== 'string') return avisar(formato.erro);
    muda({ digital: { formato, tamanhoBytes: f.size, nomeArquivo: f.name } });
  };

  const salvar = (e: FormEvent) => {
    e.preventDefault();
    setTentou(true);
    const chaves = Object.keys(erros);
    if (chaves.length) {
      avisar('Confira os campos destacados.');
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('[aria-invalid="true"], .erro-campo')
          ?.scrollIntoView({ block: 'center' }),
      );
      document.getElementById(`campo-${chaves[0]}`)?.focus();
      return;
    }
    const res = usePainel.getState().salvarProduto(publicado, n);
    if (!publicado || novo) avisar('Produto enviado para moderação.');
    else if (res.editoriais.length && res.imediatas.length)
      avisar('Preço e estoque já atualizados. O restante foi para a moderação.');
    else if (res.editoriais.length) avisar('Alteração enviada para moderação.');
    else if (res.imediatas.length) avisar('Preço e estoque atualizados na hora.');
    else avisar('Nada mudou.');
    router.push('/painel/produtos');
  };

  const disp =
    r.tipo === 'simples' || r.tipo === 'variacoes'
      ? disponibilidadePublica({ saldo: saldoTotal(r), reservaSeguranca: reserva, minimo: r.minimo })
      : null;

  return (
    <>
      <TituloPainel
        titulo={publicado ? 'Editar produto' : 'Novo produto'}
        apoio={publicado ? r.nome : 'Preencha e envie para a moderação.'}
        acao={
          <Link href="/painel/produtos" className="text-[13px]">
            Cancelar
          </Link>
        }
      />

      {reprovacao && pendentes.length === 0 && (
        <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
          <Icone nome="alert" />
          <span className="flex flex-col gap-1">
            <b>Reprovado pela moderação</b>
            <span className="text-[13px]">
              {reprovacao}{' '}
              {novo
                ? 'Corrija e envie de novo.'
                : 'A versão publicada continua no ar; corrija e envie de novo.'}
            </span>
          </span>
        </div>
      )}
      {pendentes.length > 0 && (
        <div className="banner-info bg-aviso-claro text-aviso-texto" role="status">
          <Icone nome="clock" />
          <span className="flex flex-1 flex-col gap-1">
            <b>{novo ? 'Produto novo em análise' : 'Alteração em análise'}</b>
            <span className="text-[13px]">
              {novo
                ? 'Ele aparece na vitrine depois da aprovação.'
                : `Aguardando moderação: ${pendentes.map(rotuloCampo).join(', ')}. Enquanto isso, o comprador vê a versão publicada.`}
            </span>
          </span>
          {MODO_DEMO && publicado?.id && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                usePainel.getState().aprovarProduto(publicado.id!);
                avisar('Conteúdo aprovado (demo). Preço e estoque atuais foram mantidos.');
                router.push('/painel/produtos');
              }}
            >
              Simular aprovação
            </button>
          )}
        </div>
      )}

      <form method="post" noValidate className="flex flex-col gap-4" onSubmit={salvar}>
        {/* ---------- Informações ---------- */}
        <Secao titulo="Informações">
          <div className="campo">
            <label htmlFor="campo-nome">Nome do produto</label>
            <input
              id="campo-nome"
              className="input"
              maxLength={120}
              value={r.nome}
              onChange={(e) => muda({ nome: e.target.value })}
              {...inv('nome', 'h-nome')}
            />
            <span id="h-nome" className="dica">
              {r.nome.length}/120 · sem preço, telefone ou link no nome
            </span>
            {erro('nome')}
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="campo">
              <label htmlFor="campo-categoriaId">Categoria</label>
              <select
                id="campo-categoriaId"
                className="input"
                value={r.categoriaId}
                onChange={(e) => muda({ categoriaId: e.target.value, subcategoriaId: null })}
                {...inv('categoriaId')}
              >
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
              {erro('categoriaId')}
            </div>
            <div className="campo">
              <label htmlFor="campo-sub">Subcategoria</label>
              <select
                id="campo-sub"
                className="input"
                value={r.subcategoriaId ?? ''}
                onChange={(e) => muda({ subcategoriaId: e.target.value || null })}
              >
                <option value="">Sem subcategoria</option>
                {categoria.subcategorias.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="campo-marca">Marca</label>
              <input
                id="campo-marca"
                className="input"
                maxLength={60}
                value={r.marca}
                onChange={(e) => muda({ marca: e.target.value })}
              />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="campo-descricao">Descrição</label>
            <textarea
              id="campo-descricao"
              className="input min-h-28 resize-y py-3"
              maxLength={MAX_DESCRICAO}
              value={r.descricao}
              onChange={(e) => muda({ descricao: e.target.value })}
              aria-describedby="h-desc"
            />
            <span id="h-desc" className="dica">
              {r.descricao.length}/{MAX_DESCRICAO} · medidas, material, cuidados e o que vem na embalagem
            </span>
          </div>
          <div className="campo">
            <label htmlFor="campo-carac">Características (usadas nos filtros)</label>
            <div className="flex gap-2">
              <input
                id="campo-carac"
                className="input"
                maxLength={30}
                value={novaCarac}
                placeholder="Ex.: Algodão"
                onChange={(e) => setNovaCarac(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    (e.currentTarget.nextElementSibling as HTMLButtonElement).click();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost flex-none"
                disabled={!novaCarac.trim() || r.caracteristicas.length >= MAX_CARACTERISTICAS}
                onClick={() => {
                  const c = novaCarac.trim();
                  if (!r.caracteristicas.some((x) => x.toLowerCase() === c.toLowerCase()))
                    muda({ caracteristicas: [...r.caracteristicas, c] });
                  setNovaCarac('');
                }}
              >
                Adicionar
              </button>
            </div>
            {r.caracteristicas.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {r.caracteristicas.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      className="chip"
                      aria-label={`Remover ${c}`}
                      onClick={() => muda({ caracteristicas: r.caracteristicas.filter((x) => x !== c) })}
                    >
                      {c}
                      <Icone nome="x" tamanho="sm" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Secao>

        {/* ---------- Tipo ---------- */}
        <Secao titulo="Tipo de produto">
          <fieldset className="m-0 grid grid-cols-1 gap-2.5 border-0 p-0 sm:grid-cols-2">
            <legend className="sr-only">Tipo de produto</legend>
            {TIPOS.map(([id, nome, apoio]) => (
              <label key={id} className="cartao-opcao">
                <input type="radio" name="tipo" checked={r.tipo === id} onChange={() => mudarTipo(id)} />
                <span className="flex flex-col">
                  <b className="text-sm">{nome}</b>
                  <span className="text-xs text-grafite-2">{apoio}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {r.tipo === 'variacoes' && r.variacao && (
            <EditorVariacoes r={r} muda={muda} erro={erro} inv={inv} />
          )}
          {r.tipo === 'kit' && r.kit && (
            <EditorKit
              kit={r.kit}
              mudar={(kit) => muda({ kit })}
              opcoes={paraKit}
              erro={erro('kit')}
              precoKit={r.precoCentavos}
            />
          )}
          {r.tipo === 'digital' && (
            <div className="flex flex-col gap-2" id="campo-digital" tabIndex={-1}>
              <input
                ref={arquivoDigital}
                type="file"
                accept=".pdf,.epub,.zip"
                className="sr-only"
                tabIndex={-1}
                aria-label="Arquivo do produto digital"
                onChange={escolherDigital}
              />
              {r.digital ? (
                <div className="flex flex-wrap items-center gap-3 rounded-[14px] bg-azul-nevoa px-3.5 py-3 text-sm text-azul-escuro">
                  <Icone nome="book" />
                  <span className="flex-1">
                    <b>{r.digital.nomeArquivo}</b> · {r.digital.formato} ·{' '}
                    {tamanhoLegivel(r.digital.tamanhoBytes)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => arquivoDigital.current?.click()}
                  >
                    Trocar arquivo
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost self-start"
                  onClick={() => arquivoDigital.current?.click()}
                >
                  <Icone nome="upload" tamanho="sm" />
                  Enviar arquivo (PDF, EPUB ou ZIP até 200 MB)
                </button>
              )}
              {erro('digital')}
              <span className="dica">
                Sem frete. O comprador baixa em Conta › Downloads depois do pagamento, até 5 vezes em 30 dias.
                O arquivo fica guardado em área privada.
              </span>
            </div>
          )}
        </Secao>

        {/* ---------- Mídias ---------- */}
        <Secao
          titulo="Fotos e vídeo"
          apoio={`${r.midias.length}/${MAX_MIDIAS} · ${categoria.proporcaoMidia === '4:5' ? 'moda: fotos 4:5' : 'fotos 1:1'} · vídeo 9:16 · a 1ª é a capa`}
        >
          <input
            ref={fotos}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="sr-only"
            tabIndex={-1}
            aria-label="Enviar fotos ou vídeo"
            onChange={addMidias}
          />
          {r.midias.length > 0 && (
            <ol
              className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 2xl:grid-cols-4"
              aria-label="Galeria (em ordem)"
            >
              {r.midias.map((m, i) => (
                <li
                  key={m.id}
                  className="flex flex-col gap-2 rounded-[14px] border border-solid border-borda p-2"
                >
                  <div className="relative">
                    <ArteProduto
                      categoria={categoria}
                      variante={m.variante}
                      className={`w-full rounded-[10px] ${m.tipo === 'video' ? '!aspect-[9/16] max-h-56' : ''}`}
                    />
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-marinho px-2 py-0.5 text-[11px] font-bold text-branco">
                      {i === 0 ? 'Capa' : `${i + 1}`}
                      {m.tipo === 'video' ? ' · Vídeo' : ''}
                    </span>
                  </div>
                  <label className="sr-only" htmlFor={`leg-${m.id}`}>
                    Descrição da mídia {i + 1}
                  </label>
                  <input
                    id={`leg-${m.id}`}
                    className="input min-h-11 text-sm"
                    placeholder="Descreva a imagem"
                    value={m.legenda}
                    onChange={(e) =>
                      muda({
                        midias: r.midias.map((x) => (x.id === m.id ? { ...x, legenda: e.target.value } : x)),
                      })
                    }
                  />
                  <div className="flex justify-between">
                    <span className="flex">
                      <BotaoIcone
                        rotulo={`Mover mídia ${i + 1} para antes`}
                        icone="chevL"
                        disabled={i === 0}
                        onClick={() => muda({ midias: mover(r.midias, i, -1) })}
                      />
                      <BotaoIcone
                        rotulo={`Mover mídia ${i + 1} para depois`}
                        icone="chevR"
                        disabled={i === r.midias.length - 1}
                        onClick={() => muda({ midias: mover(r.midias, i, 1) })}
                      />
                    </span>
                    <BotaoIcone
                      rotulo={`Remover mídia ${i + 1}`}
                      icone="trash"
                      onClick={() => muda({ midias: r.midias.filter((x) => x.id !== m.id) })}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
          <button
            id="campo-midias"
            type="button"
            className="area-envio cursor-pointer bg-branco"
            disabled={r.midias.length >= MAX_MIDIAS}
            onClick={() => fotos.current?.click()}
            {...inv('midias')}
          >
            <span className="text-azul">
              <Icone nome="upload" tamanho="lg" />
            </span>
            <b>Enviar fotos ou vídeo</b>
            <span className="text-[13px] text-grafite-2">
              JPG, PNG ou WebP até 10 MB · MP4 ou WebM até 50 MB · fundo claro e sem texto sobre o produto
            </span>
          </button>
          {erro('midias')}
        </Secao>

        {/* ---------- Preço e estoque ---------- */}
        <Secao titulo="Preço e estoque" apoio="Preço e estoque mudam na hora, sem moderação.">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="campo">
              <label htmlFor="campo-precoCentavos">Preço de venda (R$)</label>
              <input
                id="campo-precoCentavos"
                className="input"
                inputMode="decimal"
                value={precoTxt}
                onChange={(e) => {
                  setPrecoTxt(e.target.value);
                  muda({ precoCentavos: paraCentavos(e.target.value) });
                }}
                {...inv('precoCentavos')}
              />
              {erro('precoCentavos')}
            </div>
            <div className="campo">
              <label htmlFor="campo-precoDeCentavos">Preço &quot;de&quot; (opcional)</label>
              <input
                id="campo-precoDeCentavos"
                className="input"
                inputMode="decimal"
                value={precoDeTxt}
                onChange={(e) => {
                  setPrecoDeTxt(e.target.value);
                  muda({ precoDeCentavos: e.target.value.trim() ? paraCentavos(e.target.value) : null });
                }}
                {...inv('precoDeCentavos', 'h-de')}
              />
              <span id="h-de" className="dica">
                {r.precoDeCentavos && r.precoCentavos > 0 && r.precoDeCentavos > r.precoCentavos
                  ? `O comprador vê ${desconto(r)}% de desconto.`
                  : 'Só use se o produto já foi vendido por esse preço.'}
              </span>
              {erro('precoDeCentavos')}
            </div>
            <div className="campo">
              <label htmlFor="campo-gtin">Código de barras (GTIN/EAN, opcional)</label>
              <input
                id="campo-gtin"
                className="input"
                inputMode="numeric"
                maxLength={14}
                value={r.gtin}
                onChange={(e) => muda({ gtin: e.target.value.replace(/\D/g, '') })}
                {...inv('gtin', 'h-gtin')}
              />
              <span id="h-gtin" className="dica">
                Com o código, comparamos seu preço com ofertas do mesmo produto no marketplace.
              </span>
              {erro('gtin')}
            </div>
            {r.tipo !== 'variacoes' && r.tipo !== 'kit' && (
              <div className="campo">
                <label htmlFor="campo-sku">SKU</label>
                <input
                  id="campo-sku"
                  className="input"
                  maxLength={40}
                  value={r.sku}
                  onChange={(e) => muda({ sku: e.target.value.trim() })}
                  {...inv('sku', 'h-sku')}
                />
                <span id="h-sku" className="dica">
                  Use o mesmo código do seu sistema para a API ligar o estoque.
                </span>
                {erro('sku')}
              </div>
            )}
          </div>

          {gtinValido(r.gtin) && r.precoCentavos > 0 && (
            <div className="banner-info bg-azul-nevoa text-azul-escuro" role="status">
              <Icone nome="info" />
              <span className="text-[13px]">
                Seu preço está <b>{posicaoPreco(r.precoCentavos, FAIXA_EQUIVALENTES)}</b> de 2 ofertas
                equivalentes no marketplace ({reais(FAIXA_EQUIVALENTES[0])} a {reais(FAIXA_EQUIVALENTES[1])},
                sem frete). Aviso informativo: você decide o preço. <i>(demo)</i>
              </span>
            </div>
          )}

          {r.tipo === 'simples' && (
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <CampoNumero
                id="campo-saldo"
                rotulo="Estoque (saldo)"
                valor={r.saldo}
                mudar={(saldo) => muda({ saldo })}
                invalido={!!visiveis.saldo}
              />
              <CampoNumero
                id="campo-minimo"
                rotulo="Estoque mínimo"
                valor={r.minimo}
                mudar={(minimo) => muda({ minimo })}
                ajuda='Abaixo dele, o comprador vê "Últimas unidades".'
              />
            </div>
          )}
          {r.tipo === 'variacoes' && (
            <CampoNumero
              id="campo-minimo"
              rotulo="Estoque mínimo (soma das opções)"
              valor={r.minimo}
              mudar={(minimo) => muda({ minimo })}
              ajuda='Abaixo dele, o comprador vê "Últimas unidades". O saldo de cada opção fica na tabela de variações.'
            />
          )}
          {erro('saldo')}
          {disp && (
            <span className="text-[13px] text-grafite-2">
              O comprador vê: <b className="text-marinho">{ROTULO_DISPONIBILIDADE[disp]}</b> (saldo{' '}
              {saldoTotal(r)} − reserva de segurança {reserva}). Ele nunca vê o número.
            </span>
          )}
          {r.tipo === 'kit' && (
            <span className="text-[13px] text-grafite-2">
              O kit não tem estoque próprio: usa o dos produtos que o compõem.
            </span>
          )}
        </Secao>

        {alteracoes && (alteracoes.editoriais.length > 0 || alteracoes.imediatas.length > 0) && (
          <div className="legal-box flex flex-col gap-1 text-[13px]" role="status">
            <b>Ao salvar</b>
            {alteracoes.imediatas.length > 0 && (
              <span>Vale na hora: {alteracoes.imediatas.map(rotuloCampo).join(', ')}.</span>
            )}
            {alteracoes.editoriais.length > 0 && (
              <span>
                Vai para a moderação: {alteracoes.editoriais.map(rotuloCampo).join(', ')}. Até a aprovação, a
                vitrine mostra a versão atual.
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <Link href="/painel/produtos" className="btn btn-ghost">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary btn-lg flex-1">
            {!publicado || novo ? 'Enviar para aprovação' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </>
  );
}

/* ---------------- Partes ---------------- */

function Secao({ titulo, apoio, children }: { titulo: string; apoio?: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-3" aria-label={titulo}>
      <div className="flex flex-col gap-0.5">
        <h2>{titulo}</h2>
        {apoio && <span className="text-[13px] text-grafite-2">{apoio}</span>}
      </div>
      {children}
    </section>
  );
}

function BotaoIcone({
  rotulo,
  icone,
  onClick,
  disabled,
}: {
  rotulo: string;
  icone: 'chevL' | 'chevR' | 'trash' | 'x';
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="icon-btn text-grafite-2 hover:bg-linho hover:text-marinho disabled:opacity-40"
      aria-label={rotulo}
      title={rotulo}
      disabled={disabled}
      onClick={onClick}
    >
      <Icone nome={icone} tamanho="sm" />
    </button>
  );
}

function CampoNumero({
  id,
  rotulo,
  valor,
  mudar,
  ajuda,
  invalido,
}: {
  id: string;
  rotulo: string;
  valor: number;
  mudar: (n: number) => void;
  ajuda?: string;
  invalido?: boolean;
}) {
  return (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        className="input"
        type="number"
        min={0}
        inputMode="numeric"
        value={Number.isFinite(valor) ? valor : ''}
        onChange={(e) => mudar(Math.floor(Number(e.target.value) || 0))}
        aria-invalid={invalido || undefined}
        aria-describedby={ajuda ? `${id}-ajuda` : undefined}
      />
      {ajuda && (
        <span id={`${id}-ajuda`} className="dica">
          {ajuda}
        </span>
      )}
    </div>
  );
}

function EditorVariacoes({
  r,
  muda,
  erro,
  inv,
}: {
  r: RascunhoProduto;
  muda: (x: Partial<RascunhoProduto>) => void;
  erro: (c: string) => ReactNode;
  inv: (c: string) => Record<string, unknown>;
}) {
  const v = r.variacao!;
  const set = (opcoes: typeof v.opcoes) => muda({ variacao: { ...v, opcoes } });
  return (
    <div className="flex flex-col gap-3" id="campo-variacao" tabIndex={-1}>
      <div className="campo max-w-xs">
        <label htmlFor="var-nome">Nome da variação</label>
        <input
          id="var-nome"
          className="input"
          maxLength={30}
          value={v.nome}
          onChange={(e) => muda({ variacao: { ...v, nome: e.target.value } })}
        />
      </div>
      {v.opcoes.length > 0 && (
        <div className="tabela-wrap" tabIndex={0} role="region" aria-label="Opções da variação">
          <table className="tabela">
            <thead>
              <tr>
                <th>Opção</th>
                <th>SKU</th>
                <th>Estoque</th>
                <th>
                  <span className="sr-only">Remover</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {v.opcoes.map((o, i) => (
                <tr key={i}>
                  <td>
                    <input
                      className="input min-h-11 w-24"
                      aria-label={`Nome da opção ${i + 1}`}
                      maxLength={20}
                      value={o.nome}
                      onChange={(e) =>
                        set(v.opcoes.map((x, k) => (k === i ? { ...x, nome: e.target.value } : x)))
                      }
                    />
                  </td>
                  <td>
                    <input
                      id={`campo-opcao-${i}`}
                      className="input min-h-11 w-40"
                      aria-label={`SKU da opção ${o.nome || i + 1}`}
                      maxLength={40}
                      value={o.sku}
                      onChange={(e) =>
                        set(v.opcoes.map((x, k) => (k === i ? { ...x, sku: e.target.value.trim() } : x)))
                      }
                      {...inv(`opcao-${i}`)}
                    />
                    {erro(`opcao-${i}`)}
                  </td>
                  <td>
                    <input
                      className="input min-h-11 w-24"
                      type="number"
                      min={0}
                      aria-label={`Estoque da opção ${o.nome || i + 1}`}
                      value={o.saldo}
                      onChange={(e) =>
                        set(
                          v.opcoes.map((x, k) =>
                            k === i
                              ? { ...x, saldo: Math.max(0, Math.floor(Number(e.target.value) || 0)) }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                  <td>
                    <BotaoIcone
                      rotulo={`Remover opção ${o.nome || i + 1}`}
                      icone="trash"
                      onClick={() => set(v.opcoes.filter((_, k) => k !== i))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm self-start"
        onClick={() =>
          set([...v.opcoes, { nome: '', sku: r.sku ? `${r.sku}-${v.opcoes.length + 1}` : '', saldo: 0 }])
        }
      >
        <Icone nome="plus" tamanho="sm" />
        Adicionar opção
      </button>
      {erro('variacao')}
      <span className="dica">O comprador escolhe a opção antes de adicionar à sacola.</span>
    </div>
  );
}

function EditorKit({
  kit,
  mudar,
  opcoes,
  erro,
  precoKit,
}: {
  kit: Kit;
  mudar: (k: Kit) => void;
  opcoes: Array<{ id: string; nome: string; precoCentavos: number }>;
  erro: ReactNode;
  precoKit: number;
}) {
  const qtd = (id: string) => kit.componentes.find((c) => c.produtoId === id)?.quantidade ?? 0;
  const definir = (id: string, q: number) =>
    mudar({
      ...kit,
      componentes:
        q <= 0
          ? kit.componentes.filter((c) => c.produtoId !== id)
          : kit.componentes.some((c) => c.produtoId === id)
            ? kit.componentes.map((c) => (c.produtoId === id ? { ...c, quantidade: q } : c))
            : [...kit.componentes, { produtoId: id, quantidade: q }],
    });
  const avulso = kit.componentes.reduce(
    (a, c) => a + (opcoes.find((o) => o.id === c.produtoId)?.precoCentavos ?? 0) * c.quantidade,
    0,
  );

  return (
    <div className="flex flex-col gap-3" id="campo-kit" tabIndex={-1}>
      <div className="segmentado self-start" role="group" aria-label="Tipo de kit">
        <button
          type="button"
          aria-pressed={kit.tipo === 'fechado'}
          onClick={() => mudar({ ...kit, tipo: 'fechado' })}
        >
          Fechado
        </button>
        <button
          type="button"
          aria-pressed={kit.tipo === 'aberto'}
          onClick={() => mudar({ ...kit, tipo: 'aberto' })}
        >
          Monte o seu
        </button>
      </div>
      <span className="text-[13px] text-grafite-2">
        {kit.tipo === 'fechado'
          ? 'Composição fixa, com preço próprio. Escolha os produtos e as quantidades.'
          : 'O comprador escolhe entre as opções. Preço = soma dos escolhidos − desconto do kit.'}
      </span>
      <ul className="m-0 flex list-none flex-col gap-2 p-0" aria-label="Produtos da loja">
        {opcoes.map((o) => {
          const q = qtd(o.id);
          return (
            <li
              key={o.id}
              className="flex flex-wrap items-center gap-3 rounded-[12px] border border-solid border-borda px-3 py-2"
            >
              <label className="flex min-h-toque flex-1 items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5 flex-none accent-azul"
                  checked={q > 0}
                  onChange={(e) => definir(o.id, e.target.checked ? 1 : 0)}
                />
                <span className="flex flex-col">
                  <b>{o.nome}</b>
                  <span className="text-xs text-grafite-2">{reais(o.precoCentavos)}</span>
                </span>
              </label>
              {kit.tipo === 'fechado' && q > 0 && (
                <span className="flex items-center gap-1.5 text-[13px]">
                  <label htmlFor={`kq-${o.id}`}>Qtd.</label>
                  <input
                    id={`kq-${o.id}`}
                    className="input min-h-11 w-20"
                    type="number"
                    min={1}
                    max={20}
                    value={q}
                    onChange={(e) =>
                      definir(o.id, Math.min(20, Math.max(1, Math.floor(Number(e.target.value) || 1))))
                    }
                  />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {kit.tipo === 'aberto' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <CampoNumero
            id="kit-min"
            rotulo="Mínimo de itens"
            valor={kit.minimoItens}
            mudar={(minimoItens) => mudar({ ...kit, minimoItens })}
          />
          <CampoNumero
            id="kit-max"
            rotulo="Máximo de itens"
            valor={kit.maximoItens}
            mudar={(maximoItens) => mudar({ ...kit, maximoItens })}
          />
          <CampoNumero
            id="kit-desc"
            rotulo="Desconto do kit (%)"
            valor={kit.descontoPercentual}
            mudar={(descontoPercentual) => mudar({ ...kit, descontoPercentual })}
          />
        </div>
      )}
      {kit.tipo === 'fechado' && avulso > 0 && (
        <span className="text-[13px] text-grafite-2">
          Separados, os itens custam {reais(avulso)}
          {precoKit > 0 && precoKit < avulso ? ` · o kit economiza ${reais(avulso - precoKit)}` : ''}.
        </span>
      )}
      {erro}
    </div>
  );
}
