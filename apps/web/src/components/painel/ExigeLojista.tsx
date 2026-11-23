'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useCaminho } from '@/hooks/useCaminho';
import { linkEntrar } from '@/lib/regras/redirecionamento';
import { useSessaoLojista } from '@/stores/sessaoLojista';
import { Carregando } from '@/components/ui/Carregando';

/**
 * Painel só com o lojista logado (demonstração: sessão no aparelho).
 * Sem sessão → "Entrar no painel", guardando a tela para voltar depois.
 * Na versão real, quem barra é o middleware (cookie httpOnly validado no servidor).
 */
export function ExigeLojista({ children }: { children: ReactNode }) {
  const router = useRouter();
  const caminho = useCaminho();
  const hidratado = useSessaoLojista((s) => s.hidratado);
  const lojista = useSessaoLojista((s) => s.lojista);

  useEffect(() => {
    void useSessaoLojista.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (hidratado && !lojista) router.replace(linkEntrar(caminho, '/lojista/entrar'));
  }, [hidratado, lojista, caminho, router]);

  if (!hidratado || !lojista) return <Carregando mensagem="Carregando painel..." />;
  return children;
}
