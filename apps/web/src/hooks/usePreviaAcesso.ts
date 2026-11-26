'use client';

import { useEffect, useState } from 'react';
import { MSG_PREVIA_PRONTA, mensagemPreviaValida } from '@/lib/regras/previaAcesso';
import type { ConfigAcesso, TelaAcesso } from '@/stores/acessoVisual';

/**
 * Na prévia do editor (página aberta num iframe da mesma origem com `?previa=1`), devolve a
 * configuração em edição enviada pelo admin. Fora da prévia, devolve null.
 */
export function usePreviaAcesso(tela: TelaAcesso) {
  const [emPrevia, setEmPrevia] = useState(false);
  const [config, setConfig] = useState<ConfigAcesso | null>(null);
  useEffect(() => {
    const ativa =
      window.parent !== window && new URLSearchParams(window.location.search).get('previa') === '1';
    if (!ativa) return;
    setEmPrevia(true);
    const ouvir = (e: MessageEvent) => {
      if (mensagemPreviaValida(e.origin, window.location.origin, e.data, tela))
        setConfig(e.data.config as unknown as ConfigAcesso);
    };
    window.addEventListener('message', ouvir);
    window.parent.postMessage({ tipo: MSG_PREVIA_PRONTA }, window.location.origin);
    return () => window.removeEventListener('message', ouvir);
  }, [tela]);
  return { emPrevia, config };
}
