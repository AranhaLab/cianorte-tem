'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent, type PointerEvent } from 'react';
import { MarcaAnunciante } from '@/components/anuncios/MarcaAnunciante';
import { PreviaAnuncio } from '@/components/anuncios/PreviaAnuncio';
import { CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import {
  CTAS,
  criativoDaArte,
  erroArquivoArte,
  errosArte,
  LIMITE_ALT,
  LIMITE_SUB,
  LIMITE_TITULO,
  medidas,
  podeEnviarArte,
  qualidadeArte,
  ROTULO_CAMPANHA,
} from '@/lib/regras/arteAnuncio';
import { tamanhoLegivel } from '@/lib/regras/posVenda';
import { usePainel } from '@/stores/painel';
import type { ArteAnuncio, Campanha, EfeitoArte, VagaAnuncio } from '@/types/domain';
import { AguardaPainel, TituloPainel, avisar } from './Comum';
import { useLojaPainel } from './PainelContexto';

const EFEITOS: Array<[EfeitoArte, string, string]> = [
  ['veu', 'Véu neutro', 'Suaviza a foto por igual (padrão)'],
  ['degrade', 'Degradê na cor da marca', 'Cor sólida do lado do texto, foto aparecendo do outro'],
  ['nenhum', 'Sem efeito', 'Só para arte pronta, que já traz o próprio texto'],
];

const lerImagem = (f: File) =>
  new Promise<ArteAnuncio['imagem']>((ok, falha) => {
    const leitor = new FileReader();
    leitor.onerror = () => falha(new Error('leitura'));
    leitor.onload = () => {
      const dados = String(leitor.result);
      const img = new window.Image();
      img.onerror = () => falha(new Error('imagem'));
      img.onload = () =>
        ok({
          nome: f.name,
          tamanhoBytes: f.size,
          largura: img.naturalWidth,
          altura: img.naturalHeight,
          dados,
        });
      img.src = dados;
    };
    leitor.readAsDataURL(f);
  });

/**
 * Editor da arte do anúncio (CLAUDE.md §9). Só abre com o espaço já comprado pela loja
 * (lance vencido ou contratação direta). O lojista envia a imagem, ajusta zoom e posição
 * numa simulação da vaga, escolhe o efeito e os textos, e envia para a moderação.
 * No back-end: POST /v1/anuncios/criativos (upload privado, checagem do tipo real do arquivo).
 */
export function EditorArte({ campanhaId }: { campanhaId: string }) {
  return (
    <AguardaPainel>
      <Carregar campanhaId={campanhaId} />
    </AguardaPainel>
  );
}

function Carregar({ campanhaId }: { campanhaId: string }) {
  const campanha = usePainel((s) => s.campanhas.find((c) => c.id === campanhaId));
  const vaga = usePainel((s) => s.vagas.find((v) => v.id === campanha?.vaga));
  const voltar = (
    <Link href="/painel/anuncios" className="btn btn-primary">
      Voltar aos anúncios
    </Link>
  );
  if (!campanha || !vaga)
    return (
      <CaixaVazia
        icone="megaphone"
        titulo="Campanha não encontrada"
        texto="Ela não existe ou não é da sua loja."
        acao={voltar}
      />
    );
  if (vaga.id === 'C1')
    return (
      <CaixaVazia
        icone="tag"
        titulo="O C1 usa a foto do produto"
        texto="O produto patrocinado aparece com as fotos que você já cadastrou. Não há arte para enviar."
        acao={voltar}
      />
    );
  if (!podeEnviarArte(campanha.status) && !campanha.arte)
    return (
      <CaixaVazia
        icone="lock"
        titulo="A arte é enviada depois da compra"
        texto={
          campanha.status === 'lance_ativo'
            ? 'Seu lance ainda está em disputa. Se vencer, o envio da arte é liberado aqui.'
            : 'Esta campanha não tem espaço garantido para a sua loja.'
        }
        acao={voltar}
      />
    );
  return <Formulario key={campanha.id} campanha={campanha} vaga={vaga} />;
}

function Formulario({ campanha, vaga }: { campanha: Campanha; vaga: VagaAnuncio }) {
  const router = useRouter();
  const { loja, categorias } = useLojaPainel();
  const somenteLeitura = !podeEnviarArte(campanha.status);
  const [arte, setArte] = useState<Omit<ArteAnuncio, 'imagem'> & { imagem: ArteAnuncio['imagem'] | null }>(
    () =>
      campanha.arte ?? {
        modo: 'montar',
        imagem: null,
        enquadramento: { zoom: 1, x: 50, y: 50 },
        efeito: 'veu',
        cor: loja.cor,
        titulo: '',
        sub: '',
        cta: CTAS[0]!,
        destino: `/loja/${loja.id}`,
      },
  );
  const [tentou, setTentou] = useState(false);
  const [guia, setGuia] = useState(false);
  const arquivo = useRef<HTMLInputElement>(null);
  const arrasto = useRef<{ x: number; y: number; ex: number; ey: number; w: number; h: number } | null>(null);
  const muda = (x: Partial<ArteAnuncio>) => setArte((a) => ({ ...a, ...x }));
  const enq = (x: Partial<ArteAnuncio['enquadramento']>) =>
    setArte((a) => ({ ...a, enquadramento: { ...a.enquadramento, ...x } }));

  const desk = medidas(vaga.formato.desktop);
  const cel = medidas(vaga.formato.mobile);
  const completa = arte.imagem ? (arte as ArteAnuncio) : null;
  const erros = completa ? errosArte(completa, vaga) : { imagem: 'Envie a imagem do anúncio.' };
  const vis = tentou ? erros : {};
  const q = arte.imagem ? qualidadeArte(arte.imagem, desk, arte.enquadramento.zoom) : null;
  const categoria = categorias.find((c) => c.id === (campanha.categoriaId ?? loja.categoriaId));
  const criativo = completa
    ? criativoDaArte(completa, vaga.id, { nome: loja.nome, cor: loja.cor, id: loja.id, logo: loja.logo })
    : null;

  const escolher = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const erro = erroArquivoArte(f);
    if (erro) return avisar(erro);
    try {
      muda({ imagem: await lerImagem(f), enquadramento: { zoom: 1, x: 50, y: 50 } });
    } catch {
      avisar('Não foi possível ler a imagem. Tente outro arquivo.');
    }
  };

  // Arrastar a foto dentro da simulação muda o foco (mesmo efeito dos controles abaixo).
  const iniciarArrasto = (e: PointerEvent<HTMLDivElement>) => {
    if (somenteLeitura || !arte.imagem) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    arrasto.current = {
      x: e.clientX,
      y: e.clientY,
      ex: arte.enquadramento.x,
      ey: arte.enquadramento.y,
      w: r.width,
      h: r.height,
    };
  };
  const arrastar = (e: PointerEvent<HTMLDivElement>) => {
    const a = arrasto.current;
    if (!a) return;
    const lim = (n: number) => Math.round(Math.min(100, Math.max(0, n)));
    enq({ x: lim(a.ex - ((e.clientX - a.x) / a.w) * 100), y: lim(a.ey - ((e.clientY - a.y) / a.h) * 100) });
  };

  const enviar = () => {
    setTentou(true);
    if (!completa || Object.keys(erros).length) return avisar('Confira os pontos destacados.');
    if (usePainel.getState().enviarArte(campanha.id, completa) !== 'ok')
      return avisar('Esta campanha não permite enviar arte agora.');
    avisar('Arte enviada para aprovação. Você é avisado quando ela entrar no ar.');
    router.push('/painel/anuncios');
  };

  const erro = (c: string) =>
    vis[c] ? (
      <span id={`ea-erro-${c}`} className="erro-campo">
        {vis[c]}
      </span>
    ) : null;

  return (
    <>
      <TituloPainel
        titulo={somenteLeitura ? 'Arte do anúncio' : 'Enviar arte do anúncio'}
        apoio={`Vaga ${vaga.id} · ${vaga.nome}${vaga.pagina === 'categoria' && categoria ? ` · ${categoria.nome}` : ''} · ${campanha.periodo}`}
        acao={
          <span className="flex items-center gap-2">
            <span className={`status ${ROTULO_CAMPANHA[campanha.status][1]}`}>
              {ROTULO_CAMPANHA[campanha.status][0]}
            </span>
            <Link href="/painel/anuncios" className="text-[13px]">
              Voltar
            </Link>
          </span>
        }
      />

      {campanha.status === 'reprovada' && campanha.motivoReprovacao && (
        <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
          <Icone nome="alert" />
          <span className="text-[13px]">
            <b>Arte reprovada:</b> {campanha.motivoReprovacao} Ajuste e envie de novo. Se não reenviar antes
            do início do período, o valor é reembolsado.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* -------- Simulação da vaga -------- */}
        <section className="card flex flex-col gap-3" aria-label="Simulação da vaga">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2>Como fica no site</h2>
            {arte.modo === 'pronta' && criativo && (
              <label className="flex min-h-toque items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={guia}
                  onChange={(e) => setGuia(e.target.checked)}
                  className="h-5 w-5 accent-azul"
                />
                Mostrar área segura (40 px)
              </label>
            )}
          </div>
          {criativo ? (
            <>
              <span className="text-xs text-grafite-2">
                Computador · {vaga.formato.desktop}
                {!somenteLeitura && ' · arraste a foto para posicionar'}
              </span>
              <div className="relative">
                <PreviaAnuncio criativo={criativo} />
                {!somenteLeitura && (
                  <div
                    aria-hidden
                    className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
                    onPointerDown={iniciarArrasto}
                    onPointerMove={arrastar}
                    onPointerUp={() => (arrasto.current = null)}
                    onPointerCancel={() => (arrasto.current = null)}
                  />
                )}
                {guia && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute rounded-[6px] border-2 border-dashed border-acento"
                    style={{
                      left: `${(40 / desk.w) * 100}%`,
                      right: `${(40 / desk.w) * 100}%`,
                      top: `${(40 / desk.h) * 100}%`,
                      bottom: `${(40 / desk.h) * 100}%`,
                    }}
                  />
                )}
              </div>
              <span className="text-xs text-grafite-2">Celular · {vaga.formato.mobile} (recorte)</span>
              <div
                className="relative w-full max-w-[340px] overflow-hidden rounded-xl"
                style={{ aspectRatio: `${cel.w} / ${cel.h}`, backgroundColor: arte.cor }}
              >
                <Image
                  src={arte.imagem!.dados}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  style={{
                    objectPosition: `${arte.enquadramento.x}% ${arte.enquadramento.y}%`,
                    transform: `scale(${arte.enquadramento.zoom})`,
                    transformOrigin: `${arte.enquadramento.x}% ${arte.enquadramento.y}%`,
                  }}
                />
                {arte.efeito !== 'nenhum' && (
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ backgroundColor: arte.efeito === 'degrade' ? `${arte.cor}D1` : undefined }}
                  />
                )}
                {arte.efeito === 'veu' && <span aria-hidden className="absolute inset-0 bg-marinho/40" />}
                <span className="absolute left-2.5 top-2.5">
                  <MarcaAnunciante anuncio={criativo} className="relative" />
                </span>
                {arte.modo === 'montar' && (
                  <span
                    className="absolute inset-x-3 bottom-3 flex flex-col gap-0.5"
                    style={{ color: criativo.texto }}
                  >
                    <b className="font-titulo text-lg leading-tight">{arte.titulo || 'Seu título aqui'}</b>
                    {arte.sub && <span className="text-xs opacity-90">{arte.sub}</span>}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-azul-borda bg-azul-nevoa text-center text-[13px] text-azul-escuro"
              style={{ aspectRatio: `${desk.w} / ${desk.h}`, maxHeight: 420 }}
            >
              <Icone nome="upload" tamanho="lg" />
              <b>Envie a imagem para ver a simulação</b>
              <span>
                {desk.w} × {desk.h} px ou maior
              </span>
            </div>
          )}
          <span className="text-xs text-grafite-2">
            O selo &quot;Patrocinado&quot; com a logo e o nome da {loja.nome} aparece sempre e não pode ser
            removido.
          </span>
        </section>

        {/* -------- Controles -------- */}
        <fieldset disabled={somenteLeitura} className="card m-0 flex flex-col gap-4 border-0">
          <legend className="sr-only">Arte do anúncio</legend>

          <div className="flex flex-col gap-2">
            <b className="text-sm">Tipo de arte</b>
            <div className="segmentado self-start" role="group" aria-label="Tipo de arte">
              <button
                type="button"
                aria-pressed={arte.modo === 'montar'}
                onClick={() =>
                  muda({ modo: 'montar', efeito: arte.efeito === 'nenhum' ? 'veu' : arte.efeito })
                }
              >
                Foto + texto
              </button>
              <button
                type="button"
                aria-pressed={arte.modo === 'pronta'}
                onClick={() => muda({ modo: 'pronta' })}
              >
                Arte pronta
              </button>
            </div>
            <span className="text-xs text-grafite-2">
              {arte.modo === 'montar'
                ? 'Você envia a foto e escreve o texto; o site monta o anúncio.'
                : 'A imagem já traz o texto (deixe 40 px de margem nas bordas).'}
            </span>
          </div>

          <div className="flex flex-col gap-2" id="ea-imagem">
            <b className="text-sm">Imagem</b>
            <input
              ref={arquivo}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              aria-label="Imagem do anúncio"
              onChange={escolher}
            />
            {arte.imagem ? (
              <span className="flex flex-wrap items-center gap-2 rounded-[12px] bg-neutro-100 px-3 py-2 text-[13px]">
                <Icone nome="clip" tamanho="sm" />
                <span className="min-w-0 flex-1 truncate">
                  {arte.imagem.nome} · {arte.imagem.largura} × {arte.imagem.altura} px ·{' '}
                  {tamanhoLegivel(arte.imagem.tamanhoBytes)}
                </span>
                {!somenteLeitura && (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={() => arquivo.current?.click()}
                  >
                    Trocar
                  </button>
                )}
              </span>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => arquivo.current?.click()}>
                <Icone nome="upload" tamanho="sm" />
                Enviar imagem
              </button>
            )}
            <span className="dica">
              JPG, PNG ou WebP até 500 KB · ideal {desk.w} × {desk.h} px ou maior.
            </span>
            {q && (
              <span
                className={`status self-start ${q.nivel === 'boa' ? 'st-green' : q.nivel === 'aceitavel' ? 'st-amber' : 'st-red'}`}
              >
                {q.nivel === 'boa'
                  ? 'Nitidez boa'
                  : q.nivel === 'aceitavel'
                    ? 'Nitidez aceitável'
                    : 'Vai ficar borrada'}
              </span>
            )}
            {erro('imagem')}
          </div>

          {arte.imagem && (
            <div className="flex flex-col gap-2">
              <b className="text-sm">Enquadramento</b>
              {(
                [
                  [
                    'Zoom',
                    arte.enquadramento.zoom * 100,
                    100,
                    300,
                    (n: number) => enq({ zoom: n / 100 }),
                    '%',
                  ],
                  ['Posição horizontal', arte.enquadramento.x, 0, 100, (n: number) => enq({ x: n }), '%'],
                  ['Posição vertical', arte.enquadramento.y, 0, 100, (n: number) => enq({ y: n }), '%'],
                ] as const
              ).map(([rotulo, valor, min, max, mudar, un]) => (
                <label key={rotulo} className="flex items-center gap-2.5 text-[13px]">
                  <span className="w-[120px] flex-none">{rotulo}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={Math.round(valor)}
                    onChange={(e) => mudar(Number(e.target.value))}
                    className="w-full flex-1 accent-azul"
                  />
                  <b className="w-12 text-right">
                    {Math.round(valor)}
                    {un}
                  </b>
                </label>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-ghost self-start"
                onClick={() => enq({ zoom: 1, x: 50, y: 50 })}
              >
                Centralizar
              </button>
            </div>
          )}

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0" id="ea-efeito">
            <legend className="mb-1 text-sm font-bold">Efeito sobre a foto</legend>
            {EFEITOS.map(([id, nome, apoio]) => (
              <label key={id} className="cartao-opcao">
                <input
                  type="radio"
                  name="efeito"
                  checked={arte.efeito === id}
                  disabled={id === 'nenhum' && arte.modo === 'montar'}
                  onChange={() => muda({ efeito: id })}
                />
                <span className="flex flex-col">
                  <b className="text-sm">{nome}</b>
                  <span className="text-xs text-grafite-2">{apoio}</span>
                </span>
              </label>
            ))}
            {arte.efeito === 'degrade' && (
              <label className="flex min-h-toque items-center gap-2.5 text-[13px]">
                <input
                  type="color"
                  value={arte.cor}
                  onChange={(e) => muda({ cor: e.target.value.toUpperCase() })}
                  className="h-10 w-14 cursor-pointer rounded-[8px] border border-solid border-borda-fria bg-branco p-1"
                />
                Cor da marca
              </label>
            )}
            {erro('efeito')}
          </fieldset>

          {arte.modo === 'montar' ? (
            <div className="flex flex-col gap-3">
              <div className="campo">
                <label htmlFor="ea-titulo">Título</label>
                <input
                  id="ea-titulo"
                  className="input"
                  maxLength={LIMITE_TITULO}
                  value={arte.titulo}
                  onChange={(e) => muda({ titulo: e.target.value })}
                  aria-invalid={vis.titulo ? true : undefined}
                />
                <span className="dica">
                  {arte.titulo.length}/{LIMITE_TITULO}
                </span>
                {erro('titulo')}
              </div>
              <div className="campo">
                <label htmlFor="ea-sub">Texto de apoio (opcional)</label>
                <input
                  id="ea-sub"
                  className="input"
                  maxLength={LIMITE_SUB}
                  value={arte.sub}
                  onChange={(e) => muda({ sub: e.target.value })}
                />
                <span className="dica">
                  {arte.sub.length}/{LIMITE_SUB} · sem promessa que a loja não cumpre (CDC e CONAR)
                </span>
              </div>
              <div className="campo">
                <label htmlFor="ea-cta">Botão</label>
                <select
                  id="ea-cta"
                  className="input"
                  value={arte.cta}
                  onChange={(e) => muda({ cta: e.target.value })}
                >
                  {CTAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="campo">
              <label htmlFor="ea-titulo">O que a arte diz (texto alternativo)</label>
              <input
                id="ea-titulo"
                className="input"
                maxLength={LIMITE_ALT}
                value={arte.titulo}
                onChange={(e) => muda({ titulo: e.target.value })}
                aria-invalid={vis.titulo ? true : undefined}
              />
              <span className="dica">Lido por leitores de tela no lugar do texto da imagem.</span>
              {erro('titulo')}
            </div>
          )}

          <div className="campo">
            <label htmlFor="ea-destino">Ao clicar, abre</label>
            <select
              id="ea-destino"
              className="input"
              value={arte.destino}
              onChange={(e) => muda({ destino: e.target.value })}
            >
              <option value={`/loja/${loja.id}`}>A página da {loja.nome}</option>
              {categoria && <option value={`/c/${categoria.id}`}>A categoria {categoria.nome}</option>}
            </select>
          </div>

          {!somenteLeitura && (
            <button type="button" className="btn btn-primary btn-lg" onClick={enviar}>
              Enviar para aprovação
            </button>
          )}
          <span className="text-xs text-grafite-2">
            A equipe da plataforma confere a arte antes de ir ao ar (prazo de até 1 dia útil na versão real).
          </span>
        </fieldset>
      </div>
    </>
  );
}
