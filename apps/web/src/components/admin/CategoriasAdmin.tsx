'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { useCategoriasStore } from '@/stores/categorias';
import { useAdmin } from '@/stores/admin';
import { usePainel } from '@/stores/painel';
import type { Categoria, IconeCategoria } from '@/types/domain';
import { AguardaAdmin, TituloAdmin, useDadosAdmin } from './Comum';

const ICONES: Array<[IconeCategoria, string]> = [
  ['shirt', 'Vestuário'],
  ['hammer', 'Construção'],
  ['bed', 'Cama e banho'],
  ['sofa', 'Móveis'],
  ['cart', 'Mercado'],
  ['phone', 'Eletrônicos'],
  ['ball', 'Esporte'],
  ['drop', 'Beleza'],
  ['baby', 'Infantil'],
  ['paw', 'Pet'],
  ['book', 'Livros'],
];

const normalizar = (nome: string) =>
  nome
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const gerarId = (nome: string, existentes: string[]) => {
  const base =
    normalizar(nome)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'categoria';
  let id = base;
  let numero = 2;
  while (existentes.includes(id)) id = `${base}-${numero++}`;
  return id;
};

export function CategoriasAdmin() {
  return (
    <AguardaAdmin>
      <Conteudo />
    </AguardaAdmin>
  );
}

function MenuAcoes({
  nome,
  tipo,
  escuro = false,
  editar,
  excluir,
}: {
  nome: string;
  tipo: 'categoria' | 'subcategoria';
  escuro?: boolean;
  editar: () => void;
  excluir: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [alinharInicio, setAlinharInicio] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const botao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (evento: MouseEvent) => {
      if (!menu.current?.contains(evento.target as Node)) setAberto(false);
    };
    const teclado = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', teclado);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', teclado);
    };
  }, [aberto]);

  return (
    <div ref={menu} className="relative flex-none">
      <button
        ref={botao}
        type="button"
        aria-label={`Ações da ${tipo} ${nome}`}
        aria-expanded={aberto}
        aria-haspopup="true"
        onClick={() => {
          setAlinharInicio((botao.current?.getBoundingClientRect().right ?? 150) < 158);
          setAberto((atual) => !atual);
        }}
        className={`flex h-11 w-11 items-center justify-center rounded-full border-0 bg-transparent ${escuro ? 'text-branco hover:bg-branco/15' : 'text-marinho hover:bg-azul-nevoa'}`}
      >
        <Icone nome="moreVertical" />
      </button>
      {aberto && (
        <div
          role="group"
          aria-label={`Opções da ${tipo} ${nome}`}
          className={`absolute top-full z-30 min-w-[150px] rounded-md border border-solid border-borda-fria bg-branco p-1 text-grafite shadow-2 ${alinharInicio ? 'left-0' : 'right-0'}`}
        >
          <button
            type="button"
            aria-label={`Editar ${nome}`}
            className="flex min-h-toque w-full items-center rounded-sm border-0 bg-transparent px-3 text-left text-sm text-grafite hover:bg-azul-nevoa"
            onClick={() => {
              setAberto(false);
              editar();
            }}
          >
            Editar
          </button>
          <button
            type="button"
            aria-label={`Excluir ${nome}`}
            className="flex min-h-toque w-full items-center rounded-sm border-0 bg-transparent px-3 text-left text-sm text-grafite hover:bg-azul-nevoa"
            onClick={() => {
              setAberto(false);
              excluir();
            }}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

function Conteudo() {
  const tenant = useTenant();
  const { categorias, produtos, lojas } = useDadosAdmin();
  const edicoes = usePainel((s) => s.edicoes);
  const salvar = useCategoriasStore((s) => s.salvar);
  const registrar = useAdmin((s) => s.registrar);
  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [destaque, setDestaque] = useState('');
  const [icone, setIcone] = useState<IconeCategoria>('cart');
  const [proporcao, setProporcao] = useState<'1:1' | '4:5'>('1:1');
  const [erro, setErro] = useState('');
  const [subEditando, setSubEditando] = useState<{ categoriaId: string; id?: string } | null>(null);
  const [subNome, setSubNome] = useState('');
  const campoNome = useRef<HTMLInputElement>(null);

  const atualizar = (lista: Categoria[], acao: string, alvo: string) => {
    salvar(tenant.slug, lista);
    registrar(acao, alvo);
    setErro('');
  };
  const limpar = () => {
    setEditando(null);
    setNome('');
    setDestaque('');
    setIcone('cart');
    setProporcao('1:1');
    setErro('');
  };
  const editar = (c: Categoria) => {
    setEditando(c.id);
    setNome(c.nome);
    setDestaque(c.destaque);
    setIcone(c.icone);
    setProporcao(c.proporcaoMidia);
    setErro('');
    campoNome.current?.focus();
    campoNome.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const gravar = (e: FormEvent) => {
    e.preventDefault();
    const titulo = nome.trim();
    if (titulo.length < 2) return setErro('Informe um nome com pelo menos 2 caracteres.');
    if (categorias.some((c) => c.id !== editando && normalizar(c.nome) === normalizar(titulo)))
      return setErro('Já existe uma categoria com esse nome.');
    const existente = categorias.find((c) => c.id === editando);
    const categoria: Categoria = {
      id:
        existente?.id ??
        gerarId(
          titulo,
          categorias.map((c) => c.id),
        ),
      nome: titulo,
      icone,
      destaque: destaque.trim(),
      proporcaoMidia: proporcao,
      tom: existente?.tom ?? categorias[0]?.tom ?? 'rgb(238, 242, 250)',
      subcategorias: existente?.subcategorias ?? [],
    };
    atualizar(
      existente ? categorias.map((c) => (c.id === existente.id ? categoria : c)) : [...categorias, categoria],
      existente ? 'Editou categoria' : 'Criou categoria',
      titulo,
    );
    limpar();
  };
  const gravarSub = (e: FormEvent) => {
    e.preventDefault();
    const c = categorias.find((item) => item.id === subEditando?.categoriaId);
    const titulo = subNome.trim();
    if (!c || titulo.length < 2)
      return setErro('Informe um nome de subcategoria com pelo menos 2 caracteres.');
    if (c.subcategorias.some((s) => s.id !== subEditando?.id && normalizar(s.nome) === normalizar(titulo)))
      return setErro('Essa subcategoria já existe nesta categoria.');
    const id =
      subEditando?.id ??
      gerarId(
        titulo,
        c.subcategorias.map((s) => s.id),
      );
    const subs = subEditando?.id
      ? c.subcategorias.map((s) => (s.id === id ? { ...s, nome: titulo } : s))
      : [...c.subcategorias, { id, nome: titulo }];
    atualizar(
      categorias.map((item) => (item.id === c.id ? { ...c, subcategorias: subs } : item)),
      subEditando?.id ? 'Editou subcategoria' : 'Criou subcategoria',
      `${c.nome} · ${titulo}`,
    );
    setSubEditando(null);
    setSubNome('');
  };
  const emUso = (categoriaId: string, subId?: string) => {
    const verifica = (p: { categoriaId: string; subcategoriaId?: string | null }) =>
      p.categoriaId === categoriaId && (!subId || p.subcategoriaId === subId);
    return (
      produtos.some(verifica) ||
      Object.values(edicoes).some((e) => verifica(e.atual) || (!!e.emAnalise && verifica(e.emAnalise))) ||
      (!subId && lojas.some((l) => l.categoriaId === categoriaId))
    );
  };
  const excluir = (c: Categoria, sub?: { id: string; nome: string }) => {
    if (emUso(c.id, sub?.id))
      return setErro(
        `${sub ? 'Esta subcategoria' : 'Esta categoria'} está vinculada a produtos ou lojas. Reclassifique os itens antes de excluir.`,
      );
    if (
      !window.confirm(
        `Excluir ${sub ? `a subcategoria ${sub.nome}` : `a categoria ${c.nome} e suas subcategorias`}?`,
      )
    )
      return;
    atualizar(
      sub
        ? categorias.map((item) =>
            item.id === c.id ? { ...c, subcategorias: c.subcategorias.filter((s) => s.id !== sub.id) } : item,
          )
        : categorias.filter((item) => item.id !== c.id),
      sub ? 'Excluiu subcategoria' : 'Excluiu categoria',
      sub ? `${c.nome} · ${sub.nome}` : c.nome,
    );
    if (editando === c.id && !sub) limpar();
    setSubEditando(null);
  };

  return (
    <>
      <TituloAdmin titulo="Categorias e subcategorias" apoio={`Gerencie o catálogo de ${tenant.nome}.`} />
      <p className="banner-info bg-azul-nevoa text-azul-escuro">
        Na demonstração, as alterações ficam neste navegador e nesta cidade.
      </p>
      {erro && (
        <div role="alert" className="banner-info bg-acento-claro text-acento-escuro">
          {erro}
        </div>
      )}
      <form onSubmit={gravar} className="card flex flex-col gap-3">
        <h2>{editando ? 'Editar categoria' : 'Nova categoria'}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="campo">
            Nome da categoria
            <input
              ref={campoNome}
              className="input"
              value={nome}
              maxLength={80}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </label>
          <label className="campo">
            Ícone
            <select
              className="input"
              value={icone}
              onChange={(e) => setIcone(e.target.value as IconeCategoria)}
            >
              {ICONES.map(([id, rotulo]) => (
                <option key={id} value={id}>
                  {rotulo}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Descrição
            <input
              className="input"
              value={destaque}
              maxLength={120}
              onChange={(e) => setDestaque(e.target.value)}
            />
          </label>
          <label className="campo">
            Formato das imagens
            <select
              className="input"
              value={proporcao}
              onChange={(e) => setProporcao(e.target.value as '1:1' | '4:5')}
            >
              <option value="1:1">Quadrado (1:1)</option>
              <option value="4:5">Vertical (4:5)</option>
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">
            {editando ? 'Salvar categoria' : 'Criar categoria'}
          </button>
          {editando && (
            <button className="btn btn-ghost" type="button" onClick={limpar}>
              Cancelar
            </button>
          )}
        </div>
      </form>
      <section className="flex flex-col gap-3" aria-label="Categorias cadastradas">
        {categorias.map((c) => (
          <article key={c.id} className="card flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2>{c.nome}</h2>
              <MenuAcoes nome={c.nome} tipo="categoria" editar={() => editar(c)} excluir={() => excluir(c)} />
            </div>
            {c.destaque && <p className="m-0 text-sm text-grafite-2">{c.destaque}</p>}
            <div className="flex flex-wrap gap-2">
              {c.subcategorias.map((s) => (
                <div
                  key={s.id}
                  className="flex max-w-full items-center gap-1 rounded-lg bg-marinho pl-3 text-branco"
                >
                  <span className="break-words text-sm font-medium">{s.nome}</span>
                  <MenuAcoes
                    nome={s.nome}
                    tipo="subcategoria"
                    escuro
                    editar={() => {
                      setSubEditando({ categoriaId: c.id, id: s.id });
                      setSubNome(s.nome);
                      setErro('');
                    }}
                    excluir={() => excluir(c, s)}
                  />
                </div>
              ))}
            </div>
            {subEditando?.categoriaId === c.id ? (
              <form onSubmit={gravarSub} className="flex flex-wrap items-end gap-2">
                <label className="campo flex-1">
                  Nome da subcategoria
                  <input
                    className="input"
                    value={subNome}
                    maxLength={80}
                    onChange={(e) => setSubNome(e.target.value)}
                    required
                  />
                </label>
                <button type="submit" className="btn btn-primary">
                  {subEditando.id ? 'Salvar subcategoria' : 'Criar subcategoria'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setSubEditando(null);
                    setErro('');
                  }}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-soft self-start"
                onClick={() => {
                  setSubEditando({ categoriaId: c.id });
                  setSubNome('');
                  setErro('');
                }}
              >
                Adicionar subcategoria em {c.nome}
              </button>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
