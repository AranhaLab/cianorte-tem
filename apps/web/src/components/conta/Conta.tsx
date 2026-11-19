'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { CabecalhoPagina, CaixaVazia } from '@/components/ui/Basicos';
import { Icone } from '@/components/ui/Icone';
import { ABAS_CONTA as ABAS } from '@/lib/conta';
import { Conversas, Downloads } from './AbasPosVenda';
import { CartaoProduto } from '@/components/vitrine/CartaoProduto';
import { GradeProdutos } from '@/components/vitrine/GradeProdutos';
import { api } from '@/lib/api';
import { reais } from '@/lib/regras/dinheiro';
import { montarItens, type ItemVitrine } from '@/lib/vitrine';
import { useComprador } from '@/stores/comprador';

/** Minha conta (protótipo: vConta + accountShell). */
export function Conta({ aba }: { aba: string }) {
  const router = useRouter();
  const usuario = useComprador((s) => s.usuario)!;
  const sair = () => {
    const { sair, avisar } = useComprador.getState();
    sair();
    avisar('Você saiu da conta.');
    router.push('/');
  };

  return (
    <>
      <CabecalhoPagina titulo={`Olá, ${usuario.nome.split(' ')[0]}`} />
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Conta"
          className="flex flex-col gap-0.5 self-start rounded-xl border border-solid border-borda bg-branco p-2.5"
        >
          {ABAS.map(([id, icone, rotulo]) => (
            <Link
              key={id}
              href={`/conta/${id}`}
              aria-current={aba === id ? 'page' : undefined}
              className={`flex min-h-toque items-center gap-2.5 rounded-[12px] px-3 text-sm ${
                aba === id
                  ? 'bg-marinho font-semibold text-branco hover:text-branco'
                  : 'font-medium text-grafite-2 hover:bg-linho hover:text-marinho'
              }`}
            >
              <Icone nome={icone} />
              {rotulo}
            </Link>
          ))}
          <button
            type="button"
            onClick={sair}
            className="flex min-h-toque items-center gap-2.5 rounded-[12px] border-0 bg-transparent px-3 text-left text-sm font-medium text-grafite-2 hover:bg-linho hover:text-marinho"
          >
            <Icone nome="logout" />
            Sair
          </button>
        </nav>
        <div className="flex flex-col gap-3.5">
          {aba === 'dados' && <MeusDados />}
          {aba === 'pedidos' && <MeusPedidos />}
          {aba === 'downloads' && <Downloads />}
          {aba === 'conversas' && <Conversas />}
          {aba === 'enderecos' && <Enderecos />}
          {aba === 'favoritos' && <Favoritos />}
          {aba === 'privacidade' && <Privacidade />}
        </div>
      </div>
    </>
  );
}

function Cartao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="card flex flex-col gap-3">
      <h2>{titulo}</h2>
      {children}
    </div>
  );
}

function MeusDados() {
  const usuario = useComprador((s) => s.usuario)!;
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [celular, setCelular] = useState(usuario.celular);
  const salvar = () => {
    const { atualizarUsuario, avisar } = useComprador.getState();
    atualizarUsuario({ nome, email, celular });
    avisar('Dados atualizados.');
  };
  const campo = (id: string, rotulo: string, valor: string, set?: (v: string) => void) => (
    <div className="campo">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        className="input disabled:bg-neutro-100"
        value={valor}
        disabled={!set}
        onChange={(e) => set?.(e.target.value)}
      />
    </div>
  );
  return (
    <Cartao titulo="Meus dados">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {campo('d-nome', 'Nome', nome, setNome)}
        {campo('d-email', 'E-mail', email, setEmail)}
        {campo('d-cpf', 'CPF', usuario.cpf)}
        {campo('d-cel', 'Celular', celular, setCelular)}
      </div>
      <span className="dica">Alterar o cadastro não muda os dados de compras já feitas.</span>
      <button type="button" className="btn btn-primary self-start" onClick={salvar}>
        Salvar
      </button>
    </Cartao>
  );
}

function MeusPedidos() {
  const pedidos = useComprador((s) => s.pedidos);
  if (!pedidos.length)
    return (
      <CaixaVazia
        icone="receipt"
        titulo="Nenhum pedido ainda"
        texto="Quando você comprar, os pedidos aparecem aqui, separados por loja."
        acao={
          <Link href="/" className="btn btn-primary">
            Ir às compras
          </Link>
        }
      />
    );
  return (
    <>
      {pedidos.map((p) => (
        <Link
          key={p.id}
          href={`/pedido/${p.id}`}
          className="card flex flex-wrap items-center justify-between gap-2.5 text-inherit hover:border-azul hover:text-inherit"
        >
          <span className="flex flex-col gap-0.5">
            <b>Pedido nº {p.id}</b>
            <span className="text-[13px] text-grafite-2">
              {new Date(p.criadoEm).toLocaleString('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              })}{' '}
              · {p.subpedidos.length} loja(s) · {reais(p.totalCentavos)}
            </span>
          </span>
          <span className={`status ${p.pago ? 'st-green' : 'st-amber'}`}>
            {p.pago ? 'Pagamento confirmado' : 'Aguardando pagamento'}
          </span>
        </Link>
      ))}
    </>
  );
}

function Enderecos() {
  const tenant = useTenant();
  const e = useComprador((s) => s.usuario?.endereco);
  return (
    <Cartao titulo="Endereços">
      {e ? (
        <div className="cartao-opcao border-azul bg-azul-nevoa">
          <span className="flex-1">
            {e.rua}, {e.numero} — {e.bairro}, {tenant.nome} · {e.cep}
          </span>
          <span className="pill pill-indicada">Principal</span>
        </div>
      ) : (
        <span className="text-grafite-2">Nenhum endereço salvo. Ele é salvo na sua primeira compra.</span>
      )}
    </Cartao>
  );
}

function Favoritos() {
  const tenant = useTenant();
  const favoritos = useComprador((s) => s.favoritos);
  const [itens, setItens] = useState<ItemVitrine[] | null>(null);
  const chave = favoritos.join(',');
  useEffect(() => {
    void Promise.all([
      api.produtos.porIds(tenant.slug, chave ? chave.split(',') : []),
      api.lojas.listar(tenant.slug),
      api.categorias.listar(tenant.slug),
    ]).then(([p, l, c]) => setItens(montarItens(p, l, c)));
  }, [tenant.slug, chave]);

  if (!itens) return <div className="min-h-40" aria-busy="true" />;
  if (!itens.length)
    return (
      <CaixaVazia
        icone="heart"
        titulo="Sem favoritos"
        texto="Toque no coração dos produtos para guardar aqui."
      />
    );
  return (
    <GradeProdutos>
      {itens.map((it) => (
        <CartaoProduto key={it.produto.id} item={it} />
      ))}
    </GradeProdutos>
  );
}

/** Central de privacidade (LGPD, CLAUDE.md §6). */
function Privacidade() {
  const tenant = useTenant();
  const marketing = useComprador((s) => !!s.usuario?.marketing);
  const cookies = useComprador((s) => s.cookies);
  const { atualizarUsuario, escolherCookies, avisar } = useComprador.getState();
  const alternarCookies = () => {
    escolherCookies(cookies === 'todos' ? 'necessarios' : 'todos');
    avisar('Preferência atualizada.');
  };

  const linha = (titulo: string, desc: string, ligado: boolean, alternar: () => void) => (
    <div className="flex items-center gap-3 border-t border-solid border-neutro-200 py-2.5">
      <span className="flex flex-1 flex-col gap-0.5">
        <b className="text-sm">{titulo}</b>
        <span className="text-xs text-grafite-2">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={titulo}
        className="interruptor"
        onClick={alternar}
      />
    </div>
  );

  const pedir = async (acao: 'exportar' | 'corrigir' | 'excluir') => {
    if (acao === 'exportar') {
      const r = await api.me.exportarDados(tenant.slug);
      avisar(`Preparando o arquivo com seus dados. Enviaremos por e-mail em até ${r.prazoDias} dias.`);
    } else if (acao === 'excluir') {
      await api.me.excluirConta(tenant.slug);
      avisar(
        'Pedido de exclusão registrado. Dados exigidos por lei (como notas fiscais) são mantidos pelo prazo legal.',
      );
    } else avisar('Solicitação registrada.');
  };

  return (
    <>
      <Cartao titulo="Privacidade e dados (LGPD)">
        <span className="text-[13px] text-grafite-2">Você controla como seus dados são usados.</span>
        {linha(
          'Ofertas por e-mail e WhatsApp',
          `Comunicação de marketing das lojas e do ${tenant.marca}.`,
          marketing,
          () => {
            atualizarUsuario({ marketing: !marketing });
            avisar('Preferência atualizada.');
          },
        )}
        {linha(
          'Cookies de medição',
          'Ajudam a melhorar o site. Não identificam você diretamente.',
          cookies === 'todos',
          alternarCookies,
        )}
        {linha(
          'Anúncios personalizados',
          'Anúncios com base no que você vê na plataforma.',
          cookies === 'todos',
          alternarCookies,
        )}
      </Cartao>
      <Cartao titulo="Seus direitos">
        <div className="flex flex-wrap gap-2.5">
          <button type="button" className="btn btn-ghost" onClick={() => pedir('exportar')}>
            <Icone nome="upload" tamanho="sm" />
            Baixar meus dados
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => pedir('corrigir')}>
            <Icone nome="edit" tamanho="sm" />
            Corrigir dados
          </button>
          <button type="button" className="btn btn-danger" onClick={() => pedir('excluir')}>
            <Icone nome="trash" tamanho="sm" />
            Excluir minha conta
          </button>
        </div>
        <span className="text-[13px] text-grafite-2">
          Encarregado de dados (DPO):{' '}
          {tenant.dpo ? `${tenant.dpo.nome} · ${tenant.dpo.email}` : '[nome] · [e-mail do encarregado]'}
        </span>
      </Cartao>
    </>
  );
}
