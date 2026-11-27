'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Marca } from '@/components/marca/Marca';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import { bannerAtivo, destinoValido, padraoAcesso } from '@/lib/regras/acessoVisual';
import { MSG_PREVIA_CONFIG, MSG_PREVIA_PRONTA } from '@/lib/regras/previaAcesso';
import { useAcessoVisual, useConfigAcesso, type ConfigAcesso, type TelaAcesso } from '@/stores/acessoVisual';
import { AguardaAdmin, avisar } from './Comum';

export const TELAS_ACESSO: Array<[TelaAcesso, string, string]> = [
  ['entrar', 'Entrada do comprador', '/entrar'],
  ['cadastro', 'Cadastro do comprador', '/cadastro'],
  ['lojista-entrar', 'Entrada do lojista', '/lojista/entrar'],
  ['lojista-cadastro', 'Cadastro do lojista', '/lojista/cadastro'],
];
const ICONES: Array<[NomeIcone, string]> = [
  ['store', 'Loja'],
  ['truck', 'Entrega'],
  ['lock', 'Segurança'],
  ['shield', 'Proteção'],
  ['bag', 'Sacola'],
  ['chat', 'Conversa'],
  ['heart', 'Favoritos'],
  ['receipt', 'Pedidos'],
  ['box', 'Estoque'],
  ['megaphone', 'Anúncios'],
  ['chart', 'Vendas'],
  ['doc', 'Documento'],
  ['star', 'Estrela'],
  ['refresh', 'Troca'],
  ['check', 'Confirmação'],
  ['card', 'Cartão'],
  ['medal', 'Parceria'],
];

/** Tamanho da tela simulada na prévia (a página real roda num iframe desse tamanho). */
const APARELHOS = {
  computador: { largura: 1440, altura: 900, nome: 'Computador' },
  celular: { largura: 390, altura: 844, nome: 'Celular' },
} as const;
type Aparelho = keyof typeof APARELHOS;

/**
 * Editor das telas de acesso em tela cheia (CLAUDE.md §13.16 e §13.18): ferramentas à
 * esquerda e, à direita, a própria página de acesso num iframe, atualizada a cada
 * alteração. Nada é gravado até "Salvar configuração".
 */
export function EditorAcesso({ telaInicial }: { telaInicial: TelaAcesso }) {
  return (
    <AguardaAdmin>
      <Editor telaInicial={telaInicial} />
    </AguardaAdmin>
  );
}

function Editor({ telaInicial }: { telaInicial: TelaAcesso }) {
  const router = useRouter();
  const tenant = useTenant();
  const [tela, setTelaAtual] = useState<TelaAcesso>(telaInicial);
  const salvo = useConfigAcesso(tenant.slug, tela);
  const [r, setR] = useState<ConfigAcesso>(() => padraoAcesso(tenant, telaInicial));
  const [base, setBase] = useState<string>(() => JSON.stringify(padraoAcesso(tenant, telaInicial)));
  const [erro, setErro] = useState('');
  const sequencias = useRef({ fundo: 0, banner: 0 });
  const [lendo, setLendo] = useState({ fundo: false, banner: false });
  const [aparelho, setAparelho] = useState<Aparelho>('computador');
  const [aba, setAba] = useState<'ferramentas' | 'previa'>('ferramentas');
  useEffect(() => {
    sequencias.current.fundo++;
    sequencias.current.banner++;
    setLendo({ fundo: false, banner: false });
    const padrao = padraoAcesso(tenant, tela);
    const inicial = structuredClone(
      salvo ? { ...padrao, ...salvo, banner: { ...padrao.banner, ...salvo.banner } } : padrao,
    );
    setR(inicial);
    setBase(JSON.stringify(inicial));
    setErro('');
  }, [salvo, tela, tenant]);
  const alterado = JSON.stringify(r) !== base;

  // Sair com alterações não salvas pede confirmação (fechar a aba, voltar, trocar de tela).
  useEffect(() => {
    if (!alterado) return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [alterado]);
  const podeDescartar = () => !alterado || window.confirm('Descartar as alterações que não foram salvas?');
  const setTela = (nova: TelaAcesso) => {
    if (nova === tela || !podeDescartar()) return;
    setTelaAtual(nova);
    router.replace(`/admin/acesso/editor?tela=${nova}`, { scroll: false });
  };

  const mudar = (alteracoes: Partial<ConfigAcesso>) => setR((atual) => ({ ...atual, ...alteracoes }));
  const mudarBanner = (alteracoes: Partial<ConfigAcesso['banner']>) =>
    setR((atual) => ({ ...atual, banner: { ...atual.banner, ...alteracoes } }));
  const arquivo = (e: ChangeEvent<HTMLInputElement>, alvo: 'fundo' | 'banner') => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const sequencia = ++sequencias.current[alvo];
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type) || f.size > 700_000) {
      setLendo((atual) => ({ ...atual, [alvo]: false }));
      setErro('Escolha uma imagem JPG, PNG ou WebP de até 700 KB.');
      return;
    }
    setLendo((atual) => ({ ...atual, [alvo]: true }));
    const leitor = new FileReader();
    const falhar = () => {
      if (sequencia !== sequencias.current[alvo]) return;
      setLendo((atual) => ({ ...atual, [alvo]: false }));
      setErro('Não foi possível abrir a imagem. Escolha outro arquivo.');
    };
    leitor.onerror = falhar;
    leitor.onload = () => {
      if (sequencia !== sequencias.current[alvo] || typeof leitor.result !== 'string') return;
      const dados = leitor.result;
      const imagem = new window.Image();
      imagem.onerror = falhar;
      imagem.onload = () => {
        if (sequencia !== sequencias.current[alvo]) return;
        if (alvo === 'fundo') mudar({ fundo: dados });
        else mudarBanner({ imagem: dados });
        setLendo((atual) => ({ ...atual, [alvo]: false }));
        setErro('');
      };
      imagem.src = dados;
    };
    leitor.readAsDataURL(f);
  };
  const salvar = (e: FormEvent) => {
    e.preventDefault();
    if (lendo.fundo || lendo.banner) return;
    if (r.destaques.some((d) => !d.titulo.trim())) {
      setErro('Preencha o título de cada destaque.');
      return;
    }
    if ((r.selos ?? []).some((s) => !s.texto.trim())) {
      setErro('Preencha o texto de cada selo.');
      return;
    }
    if (!destinoValido(r.banner.link.trim())) {
      setErro('Use um endereço iniciado por / ou https:// no banner.');
      return;
    }
    if (r.banner.inicio && r.banner.fim && r.banner.inicio > r.banner.fim) {
      setErro('A data final deve ser igual ou posterior à inicial.');
      return;
    }
    if (r.banner.ativo && (!r.banner.imagem || !r.banner.titulo.trim())) {
      setErro('Para ativar o banner, escolha uma imagem e informe um título.');
      return;
    }
    if (r.banner.ativo && r.banner.patrocinado && !r.banner.anunciante?.trim()) {
      setErro('Informe o nome do anunciante para a campanha patrocinada.');
      return;
    }
    const anterior = useAcessoVisual.getState().porCidade;
    try {
      useAcessoVisual
        .getState()
        .salvar(tenant.slug, tela, { ...r, banner: { ...r.banner, link: r.banner.link.trim() } });
      setErro('');
      avisar('Configuração da tela de acesso salva.');
    } catch {
      try {
        useAcessoVisual.setState({ porCidade: anterior });
      } catch {
        // Restaura o estado em memória mesmo quando o armazenamento está cheio.
      }
      setErro('Não foi possível salvar neste navegador. Tente imagens menores.');
    }
  };

  const caminho = TELAS_ACESSO.find(([id]) => id === tela)![2];
  const foraDoPeriodo = r.banner.ativo && !bannerAtivo(r.banner);
  return (
    <div className="flex h-dvh flex-col bg-neutro-150">
      {/* Barra do topo: voltar, tela, aparelho e ações */}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-solid border-borda-fria bg-branco px-3 py-2 lg:px-4">
        <Link
          href="/admin/acesso"
          onClick={(e) => {
            if (!podeDescartar()) e.preventDefault();
          }}
          className="btn btn-ghost btn-sm min-h-toque"
        >
          <Icone nome="chevL" tamanho="sm" />
          Voltar ao admin
        </Link>
        <span className="hidden items-center gap-2 3xl:flex">
          <Marca nome={tenant.logo.nome} etiqueta={tenant.logo.etiqueta} escura />
          <span className="text-sm text-grafite-2">Editor da tela de acesso</span>
        </span>
        <label className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <select
            className="input min-h-toque w-auto min-w-0 py-1.5"
            aria-label="Tela para configurar"
            value={tela}
            onChange={(e) => setTela(e.target.value as TelaAcesso)}
          >
            {TELAS_ACESSO.map(([id, nome]) => (
              <option key={id} value={id}>
                {nome}
              </option>
            ))}
          </select>
        </label>
        <div className="segmentado" role="group" aria-label="Tamanho da prévia">
          {(Object.keys(APARELHOS) as Aparelho[]).map((a) => (
            <button key={a} type="button" aria-pressed={aparelho === a} onClick={() => setAparelho(a)}>
              <span className="inline-flex items-center gap-1.5">
                <Icone nome={a === 'celular' ? 'phone' : 'monitor'} tamanho="sm" />
                {APARELHOS[a].nome}
              </span>
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={`status ${alterado ? 'st-amber' : 'st-green'} whitespace-nowrap`}
            aria-live="polite"
          >
            {alterado ? 'Alterações não salvas' : 'Tudo salvo'}
          </span>
          <Link href={caminho} target="_blank" className="btn btn-ghost btn-sm min-h-toque">
            Abrir tela ↗
          </Link>
          <button
            type="button"
            className="btn btn-ghost btn-sm min-h-toque"
            disabled={lendo.fundo || lendo.banner}
            onClick={() => {
              if (!window.confirm('Voltar esta tela ao padrão? A configuração salva será apagada.')) return;
              useAcessoVisual.getState().restaurar(tenant.slug, tela);
              const padrao = padraoAcesso(tenant, tela);
              setR(padrao);
              setBase(JSON.stringify(padrao));
              setErro('');
              avisar('Padrão restaurado.');
            }}
          >
            Restaurar padrão
          </button>
          <button
            type="submit"
            form="form-acesso"
            className="btn btn-primary btn-sm min-h-toque"
            disabled={lendo.fundo || lendo.banner || !alterado}
          >
            Salvar configuração
          </button>
        </div>
      </header>

      {/* Celular e tablet: alterna entre ferramentas e prévia */}
      <div className="segmentado m-2 self-center lg:hidden" role="group" aria-label="Mostrar">
        <button type="button" aria-pressed={aba === 'ferramentas'} onClick={() => setAba('ferramentas')}>
          Configurar
        </button>
        <button type="button" aria-pressed={aba === 'previa'} onClick={() => setAba('previa')}>
          Prévia
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Ferramentas */}
        <form
          id="form-acesso"
          onSubmit={salvar}
          aria-label="Configuração da tela de acesso"
          className={`${aba === 'ferramentas' ? 'flex' : 'hidden'} w-full flex-col gap-3 overflow-y-auto p-3 lg:flex lg:w-[400px] lg:flex-none lg:border-r lg:border-solid lg:border-borda-fria lg:bg-neutro-100 xl:w-[440px]`}
        >
          <p className="banner-info m-0 bg-azul-nevoa text-azul-escuro">
            A prévia muda na hora. Nada vai para a tela real até você salvar. Na demonstração, fica salvo
            neste navegador e nesta cidade.
          </p>
          {(lendo.fundo || lendo.banner) && (
            <p role="status" className="text-sm text-grafite-2">
              Carregando imagem...
            </p>
          )}
          {erro && (
            <p role="alert" className="banner-info m-0 bg-acento-claro text-acento-escuro">
              {erro}
            </p>
          )}
          {foraDoPeriodo && (
            <p className="banner-info m-0 bg-aviso-claro text-aviso-texto">
              O banner está ligado, mas fora do período da campanha: a prévia mostra a tela como ela fica
              hoje.
            </p>
          )}
          <details open className="group rounded-xl border border-solid border-borda-fria bg-branco">
            <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-marinho">
              Textos principais
              <Icone nome="chevD" tamanho="sm" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-solid border-borda-fria p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!r.mostrarConteudoMobile}
                  onChange={(e) => mudar({ mostrarConteudoMobile: e.target.checked })}
                />{' '}
                Exibir textos, tópicos e selos também no celular
              </label>
              <label className="campo">
                Título
                <input
                  className="input"
                  maxLength={120}
                  value={r.titulo}
                  onChange={(e) => mudar({ titulo: e.target.value })}
                />
              </label>
              <label className="campo">
                Complemento do título
                <input
                  className="input"
                  maxLength={120}
                  value={r.tituloDestaque}
                  onChange={(e) => mudar({ tituloDestaque: e.target.value })}
                />
              </label>
              <label className="campo">
                Texto de apoio
                <textarea
                  className="input min-h-20"
                  maxLength={300}
                  value={r.apoio}
                  onChange={(e) => mudar({ apoio: e.target.value })}
                />
              </label>
              <label className="campo">
                Título do formulário (opcional)
                <input
                  className="input"
                  maxLength={120}
                  value={r.tituloFormulario}
                  onChange={(e) => mudar({ tituloFormulario: e.target.value })}
                />
                <span className="dica">Deixe vazio para manter o título padrão.</span>
              </label>
              <label className="campo">
                Texto do formulário (opcional)
                <textarea
                  className="input min-h-20"
                  maxLength={300}
                  value={r.apoioFormulario}
                  onChange={(e) => mudar({ apoioFormulario: e.target.value })}
                />
                <span className="dica">Deixe vazio para manter o texto conforme a situação do usuário.</span>
              </label>
            </div>
          </details>
          <details open className="group rounded-xl border border-solid border-borda-fria bg-branco">
            <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-marinho">
              Fundo e cores
              <Icone nome="chevD" tamanho="sm" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-solid border-borda-fria p-4">
              <label className="campo">
                Imagem de fundo
                <input
                  className="input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => arquivo(e, 'fundo')}
                />
                <span className="dica">JPG, PNG ou WebP de até 700 KB.</span>
              </label>
              {r.fundo && (
                <div className="flex flex-wrap items-center gap-3">
                  <Image
                    src={r.fundo}
                    alt="Prévia do fundo"
                    width={128}
                    height={80}
                    unoptimized
                    className="h-20 w-32 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={lendo.fundo}
                    onClick={() => mudar({ fundo: '' })}
                  >
                    Remover fundo
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['corFundo', 'Fundo e véu'],
                    ['corTexto', 'Textos do fundo'],
                    ['corMarca', 'Texto da marca'],
                    ['corEtiqueta', 'Etiqueta da marca'],
                    ['corTextoEtiqueta', 'Texto da etiqueta'],
                    ['corDestaque', 'Título destacado'],
                    ['corCartoes', 'Cartões de tópicos'],
                    ['corFormulario', 'Fundo do formulário'],
                    ['corTextoFormulario', 'Texto do formulário'],
                    ['corBotao', 'Botão principal'],
                    ['corTextoBotao', 'Texto do botão'],
                    ['corLinks', 'Links do formulário'],
                  ] as const
                ).map(([chave, nome]) => (
                  <label key={chave} className="campo">
                    {nome}
                    <input
                      type="color"
                      className="h-11 w-full cursor-pointer rounded-sm border border-solid border-borda"
                      value={r[chave]}
                      onChange={(e) => mudar({ [chave]: e.target.value })}
                    />
                  </label>
                ))}
              </div>
              <label className="campo">
                Intensidade do véu: {r.opacidade}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={r.opacidade}
                  onChange={(e) => mudar({ opacidade: Number(e.target.value) })}
                />
              </label>
            </div>
          </details>
          <details open className="group rounded-xl border border-solid border-borda-fria bg-branco">
            <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-marinho">
              Tópicos em destaque
              <Icone nome="chevD" tamanho="sm" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-solid border-borda-fria p-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={r.destaques.length >= 6}
                  onClick={() =>
                    mudar({ destaques: [...r.destaques, { icone: 'star', titulo: '', texto: '' }] })
                  }
                >
                  Adicionar tópico
                </button>
              </div>
              {r.destaques.map((d, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg bg-neutro-100 p-3">
                  <label className="campo">
                    Título do tópico {i + 1}
                    <input
                      className="input"
                      maxLength={60}
                      value={d.titulo}
                      onChange={(e) =>
                        mudar({
                          destaques: r.destaques.map((x, j) =>
                            j === i ? { ...x, titulo: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="campo">
                    Texto do tópico {i + 1}
                    <input
                      className="input"
                      maxLength={100}
                      value={d.texto}
                      onChange={(e) =>
                        mudar({
                          destaques: r.destaques.map((x, j) =>
                            j === i ? { ...x, texto: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="campo">
                    Ícone do tópico {i + 1}
                    <select
                      className="input"
                      value={d.icone}
                      onChange={(e) =>
                        mudar({
                          destaques: r.destaques.map((x, j) =>
                            j === i ? { ...x, icone: e.target.value as NomeIcone } : x,
                          ),
                        })
                      }
                    >
                      {ICONES.map(([id, nome]) => (
                        <option key={id} value={id}>
                          {nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm self-end"
                    onClick={() => mudar({ destaques: r.destaques.filter((_, j) => j !== i) })}
                  >
                    Remover tópico {i + 1}
                  </button>
                </div>
              ))}
            </div>
          </details>
          <details open className="group rounded-xl border border-solid border-borda-fria bg-branco">
            <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-marinho">
              Selos e informações
              <Icone nome="chevD" tamanho="sm" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-solid border-borda-fria p-4">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={(r.selos?.length ?? 0) >= 6}
                  onClick={() => mudar({ selos: [...(r.selos ?? []), { icone: 'check', texto: '' }] })}
                >
                  Adicionar selo
                </button>
              </div>
              {(r.selos ?? []).map((s, i) => (
                <div key={i} className="grid grid-cols-1 gap-2 rounded-lg bg-neutro-100 p-3">
                  <label className="campo">
                    Texto do selo {i + 1}
                    <input
                      className="input"
                      maxLength={60}
                      value={s.texto}
                      onChange={(e) =>
                        mudar({
                          selos: (r.selos ?? []).map((x, j) =>
                            j === i ? { ...x, texto: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="campo">
                    Ícone do selo {i + 1}
                    <select
                      className="input"
                      value={s.icone}
                      onChange={(e) =>
                        mudar({
                          selos: (r.selos ?? []).map((x, j) =>
                            j === i ? { ...x, icone: e.target.value as NomeIcone } : x,
                          ),
                        })
                      }
                    >
                      {ICONES.map(([id, nome]) => (
                        <option key={id} value={id}>
                          {nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm self-end"
                    onClick={() => mudar({ selos: (r.selos ?? []).filter((_, j) => j !== i) })}
                  >
                    Remover selo {i + 1}
                  </button>
                </div>
              ))}
            </div>
          </details>
          <details open className="group rounded-xl border border-solid border-borda-fria bg-branco">
            <summary className="flex min-h-toque cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold text-marinho">
              Banner opcional
              <Icone nome="chevD" tamanho="sm" className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="flex flex-col gap-3 border-t border-solid border-borda-fria p-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.banner.ativo}
                  onChange={(e) => mudarBanner({ ativo: e.target.checked })}
                />{' '}
                Exibir campanha nesta tela
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={r.banner.patrocinado}
                  onChange={(e) => mudarBanner({ patrocinado: e.target.checked })}
                />{' '}
                Identificar como patrocinado
              </label>
              {r.banner.patrocinado && (
                <label className="campo">
                  Nome do anunciante
                  <input
                    className="input"
                    maxLength={100}
                    value={r.banner.anunciante ?? ''}
                    onChange={(e) => mudarBanner({ anunciante: e.target.value })}
                  />
                </label>
              )}
              <label className="campo">
                Imagem do banner
                <input
                  className="input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => arquivo(e, 'banner')}
                />
                <span className="dica">JPG, PNG ou WebP de até 700 KB.</span>
              </label>
              {r.banner.imagem && (
                <div className="flex flex-wrap items-center gap-3">
                  <Image
                    src={r.banner.imagem}
                    alt="Prévia do banner"
                    width={160}
                    height={80}
                    unoptimized
                    className="h-20 w-40 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={lendo.banner}
                    onClick={() => mudarBanner({ imagem: '' })}
                  >
                    Remover imagem
                  </button>
                </div>
              )}
              <label className="campo">
                Título do banner
                <input
                  className="input"
                  maxLength={100}
                  value={r.banner.titulo}
                  onChange={(e) => mudarBanner({ titulo: e.target.value })}
                />
              </label>
              <label className="campo">
                Descrição do banner
                <input
                  className="input"
                  maxLength={200}
                  value={r.banner.descricao}
                  onChange={(e) => mudarBanner({ descricao: e.target.value })}
                />
              </label>
              <label className="campo">
                Link do banner (opcional)
                <input
                  className="input"
                  placeholder="/loja/exemplo ou https://..."
                  value={r.banner.link}
                  onChange={(e) => mudarBanner({ link: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="campo">
                  Início da campanha
                  <input
                    type="date"
                    className="input"
                    value={r.banner.inicio}
                    onChange={(e) => mudarBanner({ inicio: e.target.value })}
                  />
                </label>
                <label className="campo">
                  Fim da campanha
                  <input
                    type="date"
                    className="input"
                    value={r.banner.fim}
                    onChange={(e) => mudarBanner({ fim: e.target.value })}
                  />
                </label>
              </div>
              <p className="dica">
                Datas opcionais e inclusivas; sem datas, a campanha ativa aparece continuamente.
              </p>
            </div>
          </details>
        </form>

        {/* Prévia */}
        <section
          aria-label="Prévia da tela"
          className={`${aba === 'previa' ? 'flex' : 'hidden'} min-w-0 flex-1 flex-col lg:flex`}
        >
          <Previa caminho={caminho} tela={tela} config={r} aparelho={aparelho} />
        </section>
      </div>
    </div>
  );
}

/**
 * A prévia é a página de acesso de verdade, num iframe do tamanho do aparelho, reduzida
 * para caber. A configuração em edição chega por postMessage (mesma origem) e não é salva.
 */
function Previa({
  caminho,
  tela,
  config,
  aparelho,
}: {
  caminho: string;
  tela: TelaAcesso;
  config: ConfigAcesso;
  aparelho: Aparelho;
}) {
  const area = useRef<HTMLDivElement>(null);
  const quadro = useRef<HTMLIFrameElement>(null);
  const [escala, setEscala] = useState(1);
  const { largura, altura } = APARELHOS[aparelho];

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const medir = () => {
      const folga = 32;
      setEscala(Math.min(1, (el.clientWidth - folga) / largura, (el.clientHeight - folga) / altura));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [largura, altura]);

  const enviar = useCallback(() => {
    quadro.current?.contentWindow?.postMessage(
      { tipo: MSG_PREVIA_CONFIG, tela, config },
      window.location.origin,
    );
  }, [tela, config]);
  useEffect(enviar, [enviar]);
  // A página da prévia avisa quando está pronta para receber (depois de hidratar).
  useEffect(() => {
    const ouvir = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.tipo === MSG_PREVIA_PRONTA) enviar();
    };
    window.addEventListener('message', ouvir);
    return () => window.removeEventListener('message', ouvir);
  }, [enviar]);

  return (
    <div ref={area} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4">
      <div
        className="flex-none overflow-hidden rounded-xl bg-branco shadow-2 ring-1 ring-borda-fria"
        style={{ width: largura * escala, height: altura * escala }}
      >
        <iframe
          ref={quadro}
          key={`${caminho}-${aparelho}`}
          src={`${caminho}?previa=1`}
          title={`Prévia: ${APARELHOS[aparelho].nome.toLowerCase()}, ${largura} × ${altura}`}
          onLoad={enviar}
          className="origin-top-left border-0"
          style={{ width: largura, height: altura, transform: `scale(${escala})` }}
        />
      </div>
      <span className="absolute bottom-2 right-4 text-xs text-grafite-2">
        {APARELHOS[aparelho].nome} · {largura} × {altura} · {Math.round(escala * 100)}%
      </span>
    </div>
  );
}
