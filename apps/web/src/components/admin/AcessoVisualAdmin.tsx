'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import type { NomeIcone } from '@/components/ui/Icone';
import { destinoValido, padraoAcesso } from '@/lib/regras/acessoVisual';
import { useAcessoVisual, useConfigAcesso, type ConfigAcesso, type TelaAcesso } from '@/stores/acessoVisual';
import { AguardaAdmin, TituloAdmin, avisar } from './Comum';

const TELAS: Array<[TelaAcesso, string, string]> = [
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

export function AcessoVisualAdmin() {
  return (
    <AguardaAdmin>
      <Conteudo />
    </AguardaAdmin>
  );
}

function Conteudo() {
  const tenant = useTenant();
  const [tela, setTela] = useState<TelaAcesso>('entrar');
  const salvo = useConfigAcesso(tenant.slug, tela);
  const [r, setR] = useState<ConfigAcesso>(() => padraoAcesso(tenant, 'entrar'));
  const [erro, setErro] = useState('');
  const sequencias = useRef({ fundo: 0, banner: 0 });
  const [lendo, setLendo] = useState({ fundo: false, banner: false });
  useEffect(() => {
    sequencias.current.fundo++;
    sequencias.current.banner++;
    setLendo({ fundo: false, banner: false });
    const padrao = padraoAcesso(tenant, tela);
    setR(
      structuredClone(
        salvo ? { ...padrao, ...salvo, banner: { ...padrao.banner, ...salvo.banner } } : padrao,
      ),
    );
    setErro('');
  }, [salvo, tela, tenant]);
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
  return (
    <>
      <TituloAdmin
        titulo="Telas de acesso"
        apoio="Configure as telas de entrada e cadastro de compradores e lojistas."
      />
      <p className="banner-info bg-azul-nevoa text-azul-escuro">
        Na demonstração, as alterações e imagens ficam neste navegador e nesta cidade.
      </p>
      <div className="card campo">
        <label htmlFor="tela-acesso">Tela para configurar</label>
        <select
          id="tela-acesso"
          className="input"
          value={tela}
          onChange={(e) => setTela(e.target.value as TelaAcesso)}
        >
          {TELAS.map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
        <Link href={TELAS.find(([id]) => id === tela)![2]} target="_blank" className="self-start text-sm">
          Abrir tela de acesso ↗
        </Link>
      </div>
      <form onSubmit={salvar} className="flex flex-col gap-4">
        {(lendo.fundo || lendo.banner) && (
          <p role="status" className="text-sm text-grafite-2">
            Carregando imagem...
          </p>
        )}
        {erro && (
          <p role="alert" className="banner-info bg-acento-claro text-acento-escuro">
            {erro}
          </p>
        )}
        <section className="card flex flex-col gap-3">
          <h2>Textos principais</h2>
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
        </section>
        <section className="card flex flex-col gap-3">
          <h2>Fundo e cores</h2>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </section>
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2>Tópicos em destaque</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={r.destaques.length >= 6}
              onClick={() => mudar({ destaques: [...r.destaques, { icone: 'star', titulo: '', texto: '' }] })}
            >
              Adicionar tópico
            </button>
          </div>
          {r.destaques.map((d, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg bg-neutro-100 p-3 sm:grid-cols-2">
              <label className="campo">
                Título do tópico {i + 1}
                <input
                  className="input"
                  maxLength={60}
                  value={d.titulo}
                  onChange={(e) =>
                    mudar({
                      destaques: r.destaques.map((x, j) => (j === i ? { ...x, titulo: e.target.value } : x)),
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
                      destaques: r.destaques.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)),
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
        </section>
        <section className="card flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2>Selos e informações</h2>
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
            <div key={i} className="grid grid-cols-1 gap-2 rounded-lg bg-neutro-100 p-3 sm:grid-cols-2">
              <label className="campo">
                Texto do selo {i + 1}
                <input
                  className="input"
                  maxLength={60}
                  value={s.texto}
                  onChange={(e) =>
                    mudar({
                      selos: (r.selos ?? []).map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)),
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
        </section>
        <section className="card flex flex-col gap-3">
          <h2>Banner opcional</h2>
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        </section>
        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn btn-primary" disabled={lendo.fundo || lendo.banner}>
            Salvar configuração
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={lendo.fundo || lendo.banner}
            onClick={() => {
              useAcessoVisual.getState().restaurar(tenant.slug, tela);
              setR(padraoAcesso(tenant, tela));
              setErro('');
              avisar('Padrão restaurado.');
            }}
          >
            Restaurar padrão
          </button>
        </div>
      </form>
    </>
  );
}
