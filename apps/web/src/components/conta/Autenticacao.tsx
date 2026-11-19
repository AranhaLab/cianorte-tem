'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent, type ReactNode } from 'react';
import { useTenant } from '@/components/providers/TenantProvider';
import { Icone } from '@/components/ui/Icone';
import { api } from '@/lib/api';
import { VERSAO_TERMOS, celularValido, cpfValido, emailValido, senhaValida } from '@/lib/regras/cadastro';
import { useComprador } from '@/stores/comprador';

/** Só aceita voltar para o checkout (evita redirecionamento aberto via ?next=). */
const destino = (next: string | null) => (next === 'checkout' ? '/checkout' : '/conta');

function CaixaAuth({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto my-6 max-w-[520px]">
      <div className="flex flex-col gap-4 rounded-xl border border-solid border-borda bg-branco p-6">
        {children}
      </div>
    </div>
  );
}

/** Protótipo: vEntrar. */
export function Entrar({ next }: { next: string | null }) {
  const tenant = useTenant();
  const router = useRouter();
  const { entrar, avisar } = useComprador.getState();

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    // Demo: mantém o usuário já cadastrado neste aparelho. Real: POST /v1/auth/entrar (cookie httpOnly).
    const atual = useComprador.getState().usuario;
    entrar(atual ?? (await api.auth.entrar(tenant.slug, email)));
    avisar('Bem-vindo!');
    router.push(destino(next));
  };

  return (
    <CaixaAuth>
      <div className="flex flex-col gap-1">
        <h1>Entrar</h1>
        <span className="text-[13px] text-grafite-2">
          {next === 'checkout'
            ? 'Falta pouco: entre para fechar a compra. Sua sacola continua aqui.'
            : 'Acompanhe pedidos, endereços e favoritos.'}
        </span>
      </div>
      <form method="post" className="flex flex-col gap-3" onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="l-email">E-mail</label>
          <input id="l-email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div className="campo">
          <label htmlFor="l-senha">Senha</label>
          <input
            id="l-senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            className="input"
          />
        </div>
        <button
          type="button"
          className="self-end border-0 bg-transparent text-[13px] text-azul"
          onClick={() => avisar('Enviamos um link de recuperação para o seu e-mail.')}
        >
          Esqueci minha senha
        </button>
        <button type="submit" className="btn btn-primary btn-lg">
          Entrar
        </button>
      </form>
      <div className="flex items-center gap-2.5">
        <span className="h-px flex-1 bg-borda" />
        <span className="text-xs text-grafite-2">ou</span>
        <span className="h-px flex-1 bg-borda" />
      </div>
      <Link href={`/cadastro${next ? `?next=${next}` : ''}`} className="btn btn-ghost btn-lg">
        Criar conta grátis
      </Link>
    </CaixaAuth>
  );
}

/**
 * Protótipo: vCadastro. Só o necessário para entregar e emitir nota.
 * Checkboxes NÃO pré-marcados e separados: termos (obrigatório), idade (obrigatório),
 * marketing (opcional). O back-end grava o consentimento com data/hora, versão e IP (CLAUDE.md §6).
 */
export function Cadastro({ next }: { next: string | null }) {
  const tenant = useTenant();
  const router = useRouter();
  const [erros, setErros] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = (k: string) => String(fd.get(k) ?? '').trim();
    const lista: string[] = [];
    if (v('nome').split(' ').filter(Boolean).length < 2) lista.push('Informe nome e sobrenome.');
    if (!cpfValido(v('cpf'))) lista.push('CPF inválido.');
    if (!celularValido(v('celular'))) lista.push('Celular com DDD inválido.');
    if (!emailValido(v('email'))) lista.push('E-mail inválido.');
    if (!senhaValida(String(fd.get('senha') ?? '')))
      lista.push('A senha precisa de 8 caracteres, com letras e números.');
    if (!fd.get('termos')) lista.push('Aceite os Termos de Uso e a Política de Privacidade.');
    if (!fd.get('idade')) lista.push('Confirme que tem 18 anos ou mais.');
    setErros(lista);
    if (lista.length) return;

    setEnviando(true);
    const usuario = await api.auth.cadastro(tenant.slug, {
      nome: v('nome'),
      cpf: v('cpf'),
      email: v('email'),
      celular: v('celular'),
      senha: String(fd.get('senha')),
      aceiteTermos: true,
      declaraMaioridade: true,
      marketing: !!fd.get('marketing'),
      versaoTermos: VERSAO_TERMOS,
    });
    const { entrar, avisar } = useComprador.getState();
    entrar(usuario);
    avisar('Conta criada.');
    router.push(destino(next));
  };

  return (
    <CaixaAuth>
      <div className="flex flex-col gap-1">
        <h1>Criar conta</h1>
        <span className="text-[13px] text-grafite-2">
          Só pedimos o necessário para entregar e emitir a nota fiscal.
        </span>
      </div>
      <form method="post" className="flex flex-col gap-3" onSubmit={enviar} noValidate>
        <div className="campo">
          <label htmlFor="c-nome">Nome completo</label>
          <input id="c-nome" name="nome" autoComplete="name" required className="input" />
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="campo">
            <label htmlFor="c-cpf">CPF</label>
            <input
              id="c-cpf"
              name="cpf"
              inputMode="numeric"
              required
              className="input"
              aria-describedby="h-cpf"
            />
            <span id="h-cpf" className="dica">
              Obrigatório para a nota fiscal.
            </span>
          </div>
          <div className="campo">
            <label htmlFor="c-cel">Celular (WhatsApp)</label>
            <input
              id="c-cel"
              name="celular"
              inputMode="tel"
              autoComplete="tel"
              required
              className="input"
              aria-describedby="h-cel"
            />
            <span id="h-cel" className="dica">
              Avisos do pedido.
            </span>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="c-email">E-mail</label>
          <input id="c-email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div className="campo">
          <label htmlFor="c-senha">Senha</label>
          <input
            id="c-senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="input"
            aria-describedby="h-senha"
          />
          <span id="h-senha" className="dica">
            Mínimo de 8 caracteres, com letras e números.
          </span>
        </div>

        <Consentimento nome="termos">
          Li e aceito os{' '}
          <Link href="/termos" target="_blank">
            Termos de Uso
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" target="_blank">
            Política de Privacidade
          </Link>
          . <b>(obrigatório)</b>
        </Consentimento>
        <Consentimento nome="idade">
          Declaro ter 18 anos ou mais. <b>(obrigatório)</b>
        </Consentimento>
        <Consentimento nome="marketing">
          Quero receber ofertas das lojas de {tenant.nome} por e-mail e WhatsApp. (opcional, você pode
          cancelar quando quiser)
        </Consentimento>

        <div className="legal-box flex items-start gap-1.5">
          <Icone nome="shield" tamanho="sm" />
          <span>
            Seus dados são usados para processar compras, entregas e notas fiscais (execução de contrato), e
            cada loja só recebe o necessário para atender o seu pedido. Você pode acessar, corrigir, baixar ou
            excluir seus dados em Conta › Privacidade.
          </span>
        </div>

        {erros.length > 0 && (
          <div className="banner-info bg-acento-claro text-acento-escuro" role="alert">
            <Icone nome="alert" />
            <ul className="m-0 list-none p-0">
              {erros.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-lg" disabled={enviando}>
          Criar conta{next === 'checkout' ? ' e continuar' : ''}
        </button>
      </form>
      <span className="text-center text-[13px] text-grafite-2">
        Já tem conta?{' '}
        <Link href={`/entrar${next ? `?next=${next}` : ''}`} className="underline">
          Entrar
        </Link>
      </span>
    </CaixaAuth>
  );
}

function Consentimento({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 text-sm leading-[1.45]">
      {/* Nunca pré-marcado (LGPD: consentimento livre e inequívoco) */}
      <input
        type="checkbox"
        name={nome}
        defaultChecked={false}
        className="mt-px h-5 w-5 flex-none accent-azul"
      />
      <span>{children}</span>
    </label>
  );
}
