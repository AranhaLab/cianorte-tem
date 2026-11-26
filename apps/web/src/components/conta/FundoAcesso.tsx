'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { Marca } from '@/components/marca/Marca';
import { ContextoFormularioAcesso } from '@/components/conta/ContextoFormularioAcesso';
import { Icone, type NomeIcone } from '@/components/ui/Icone';
import type { Tenant } from '@/types/domain';
import { bannerAtivo, destinoValido, padraoAcesso } from '@/lib/regras/acessoVisual';
import { usePreviaAcesso } from '@/hooks/usePreviaAcesso';
import { useConfigAcesso, type TelaAcesso } from '@/stores/acessoVisual';

export type DestaqueAcesso = { icone: NomeIcone; titulo: string; texto: string };

/**
 * Páginas de acesso (entrar, criar conta, painel do lojista): página própria, sem
 * cabeçalho, categorias nem rodapé, como nos grandes marketplaces.
 *
 * Fundo: foto da cidade (`tenant.fundoAcesso`) em tela cheia sob um véu marinho.
 * Desktop: marca, frase, 4 vantagens e selos à esquerda; cartão do formulário à direita.
 * Celular: a foto vira uma faixa no topo e o cartão vem logo abaixo.
 * Cidade sem foto: fundo marinho da marca.
 */
export function FundoAcesso({
  tenant,
  tela,
  titulo,
  tituloDestaque,
  apoio,
  destaques,
  selos,
  children,
}: {
  tenant: Tenant;
  tela: TelaAcesso;
  /** Frase grande (desktop); `tituloDestaque` sai em azul-claro logo depois. */
  titulo: string;
  tituloDestaque: string;
  apoio: string;
  /** Quatro vantagens em cartões (2 × 2). */
  destaques: DestaqueAcesso[];
  selos?: Array<[NomeIcone, string]>;
  children: ReactNode;
}) {
  const gravado = useConfigAcesso(tenant.slug, tela);
  // No editor do admin, mostra a configuração em edição (ainda não salva).
  const previa = usePreviaAcesso(tela);
  const salvo = previa.config ?? gravado;
  const [, atualizarHorario] = useState(0);
  useEffect(() => {
    if (!salvo?.banner?.ativo) return;
    const timer = window.setInterval(() => atualizarHorario((n) => n + 1), 60_000);
    return () => window.clearInterval(timer);
  }, [salvo?.banner?.ativo]);
  const padrao = padraoAcesso(tenant, tela);
  const config = salvo ? { ...padrao, ...salvo, banner: { ...padrao.banner, ...salvo.banner } } : undefined;
  const fundo = config ? (config.fundo ? { src: config.fundo } : undefined) : tenant.fundoAcesso;
  titulo = config?.titulo ?? titulo;
  tituloDestaque = config?.tituloDestaque ?? tituloDestaque;
  apoio = config?.apoio ?? apoio;
  destaques = config?.destaques ?? destaques;
  const banner = config?.banner && bannerAtivo(config.banner) ? config.banner : null;
  const listaSelos: Array<[NomeIcone, string]> = config?.selos?.map((s) => [s.icone, s.texto]) ??
    selos ?? [
      ['check', 'Pix'],
      ['card', 'Cartão de crédito'],
      ['shield', 'LGPD'],
      ['medal', `Parceria ${tenant.associacao}`],
    ];
  return (
    <div
      // Na prévia, a página é só para ver: sem cliques nem foco (a rolagem continua).
      inert={previa.emPrevia || undefined}
      className="relative isolate min-h-dvh overflow-hidden bg-marinho"
      style={config ? { backgroundColor: config.corFundo } : undefined}
    >
      {fundo && (
        <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[46vh] lg:inset-0 lg:h-auto">
          <Image
            src={fundo.src}
            alt=""
            fill
            priority
            unoptimized // arquivo já otimizado; sem recompressão, a foto fica nítida
            sizes="100vw"
            className="object-cover object-[50%_40%]"
          />
          {/* Véu: uniforme no desktop (um pouco mais forte à esquerda, atrás do texto);
              no celular escurece para baixo até encontrar o marinho do cartão. */}
          {config ? (
            <div
              className="absolute inset-0"
              style={{ backgroundColor: config.corFundo, opacity: config.opacidade / 100 }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-b from-marinho/55 via-marinho/45 to-marinho lg:bg-marinho/65 lg:bg-none" />
              <div className="absolute inset-0 hidden bg-gradient-to-r from-marinho/45 via-marinho/15 to-transparent lg:block" />
            </>
          )}
        </div>
      )}

      <div className="mx-auto grid min-h-dvh w-full max-w-container content-start gap-5 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:content-center lg:gap-12 lg:py-6 xl:grid-cols-[minmax(0,1fr)_460px] 3xl:gap-20">
        {/* Esquerda: marca, frase e vantagens (no celular, só a marca) */}
        <section
          className="flex flex-col gap-6 text-branco"
          aria-label={`${titulo} ${tituloDestaque}`.trim() || 'Apresentação'}
          style={config ? { color: config.corTexto } : undefined}
        >
          <div className="flex items-center justify-between gap-3">
            <Link href="/" aria-label={`${tenant.marca} — voltar à página inicial`}>
              <Marca
                nome={tenant.nome}
                corNome={config?.corMarca}
                corEtiqueta={config?.corEtiqueta}
                corTextoEtiqueta={config?.corTextoEtiqueta}
              />
            </Link>
            {/* No celular, "voltar" fica na faixa da foto e o cartão ganha altura */}
            <Link
              href="/"
              className="inline-flex min-h-toque items-center gap-1 rounded-[10px] px-2 text-sm font-semibold text-branco hover:bg-branco/10 hover:text-branco lg:hidden"
            >
              <Icone nome="chevL" tamanho="sm" />
              Voltar para a loja
            </Link>
          </div>

          <div className={`${config?.mostrarConteudoMobile ? 'flex' : 'hidden lg:flex'} flex-col gap-6`}>
            {(titulo || tituloDestaque) && (
              <p
                className="m-0 max-w-[620px] font-titulo text-[28px] font-bold leading-[1.06] tracking-[-0.01em] text-branco lg:text-[40px] xl:text-[48px] 3xl:text-[54px]"
                style={config ? { color: config.corTexto } : undefined}
              >
                {titulo}{' '}
                <span className="text-azul-claro" style={config ? { color: config.corDestaque } : undefined}>
                  {tituloDestaque}
                </span>
              </p>
            )}
            {apoio && (
              <p
                className="m-0 max-w-[520px] text-[17px] leading-relaxed text-branco/90"
                style={config ? { color: config.corTexto } : undefined}
              >
                {apoio}
              </p>
            )}

            <ul className="m-0 grid max-w-[640px] list-none grid-cols-2 gap-3 p-0">
              {destaques.map((d) => (
                <li
                  key={d.titulo}
                  className="flex items-center gap-3 rounded-xl bg-marinho/45 p-3 ring-1 ring-inset ring-branco/15 backdrop-blur-md"
                  style={
                    config ? { backgroundColor: `${config.corCartoes}b3`, color: config.corTexto } : undefined
                  }
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-branco/10 text-branco"
                    style={config ? { color: config.corTexto } : undefined}
                  >
                    <Icone nome={d.icone} tamanho="sm" />
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-sm font-semibold text-branco"
                      style={config ? { color: config.corTexto } : undefined}
                    >
                      {d.titulo}
                    </span>
                    <span
                      className="block text-[13px] text-branco/85"
                      style={config ? { color: config.corTexto } : undefined}
                    >
                      {d.texto}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <ul
              className="m-0 flex list-none flex-wrap gap-2 p-0"
              aria-label="Formas de pagamento e garantias"
            >
              {listaSelos.map(([icone, texto]) => (
                <li
                  key={texto}
                  className="inline-flex items-center gap-1.5 rounded-full bg-marinho/45 px-3 py-1.5 text-[13px] font-semibold text-branco ring-1 ring-inset ring-branco/20 backdrop-blur-md"
                  style={
                    config ? { backgroundColor: `${config.corCartoes}b3`, color: config.corTexto } : undefined
                  }
                >
                  <Icone nome={icone} tamanho="sm" />
                  {texto}
                </li>
              ))}
            </ul>
          </div>
          {banner && (
            <div className="max-w-[640px] overflow-hidden rounded-xl bg-branco text-marinho shadow-1">
              {banner.link && destinoValido(banner.link) ? (
                <Link href={banner.link} className="block text-marinho hover:text-marinho">
                  <ImagemBanner banner={banner} />
                </Link>
              ) : (
                <ImagemBanner banner={banner} />
              )}
            </div>
          )}
        </section>

        {/* Direita: cartão do formulário */}
        <main className={`w-full ${fundo ? 'max-lg:pt-[12vh]' : ''}`}>
          <div
            className={`mx-auto w-full max-w-[480px] rounded-[24px] bg-branco p-6 shadow-2 sm:p-7 lg:mx-0 lg:max-w-none ${config ? 'acesso-form-personalizado' : ''}`}
            style={
              config
                ? ({
                    backgroundColor: config.corFormulario,
                    color: config.corTextoFormulario,
                    '--acesso-cor-texto': config.corTextoFormulario,
                    '--acesso-cor-botao': config.corBotao,
                    '--acesso-cor-texto-botao': config.corTextoBotao,
                    '--acesso-cor-links': config.corLinks,
                  } as CSSProperties)
                : undefined
            }
          >
            <Link
              href="/"
              className="-ml-2 mb-2 hidden min-h-toque items-center gap-1.5 rounded-[10px] px-2 text-sm font-semibold text-grafite-2 hover:bg-azul-nevoa hover:text-marinho lg:inline-flex"
            >
              <Icone nome="chevL" tamanho="sm" />
              Voltar para a loja
            </Link>
            <ContextoFormularioAcesso.Provider
              value={{ titulo: config?.tituloFormulario ?? '', apoio: config?.apoioFormulario ?? '' }}
            >
              {children}
            </ContextoFormularioAcesso.Provider>
            <p className="m-0 mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-grafite-2">
              <Icone nome="lock" tamanho="sm" />
              Ambiente seguro ·
              <Link href="/termos" className="font-medium text-azul hover:underline">
                Termos
              </Link>
              ·
              <Link href="/privacidade" className="font-medium text-azul hover:underline">
                Privacidade
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

function ImagemBanner({ banner }: { banner: NonNullable<ReturnType<typeof useConfigAcesso>>['banner'] }) {
  return (
    <>
      <Image
        src={banner.imagem}
        alt={banner.titulo || 'Campanha'}
        width={1200}
        height={300}
        unoptimized
        className="h-auto w-full object-cover"
      />
      <div className="px-4 py-3 text-sm">
        {banner.patrocinado && (
          <span className="block text-xs font-bold uppercase text-grafite-2">
            Patrocinado{banner.anunciante ? ` · ${banner.anunciante}` : ''}
          </span>
        )}
        <b>{banner.titulo}</b>
        {banner.descricao && <p className="m-0">{banner.descricao}</p>}
      </div>
    </>
  );
}
