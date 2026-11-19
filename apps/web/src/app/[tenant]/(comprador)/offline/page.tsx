import { CaixaVazia } from '@/components/ui/Basicos';

export const metadata = { title: 'Sem conexão', robots: { index: false } };

/** Mostrada pelo service worker quando não há rede nem cópia da página. */
export default function Offline() {
  return (
    <CaixaVazia
      icone="refresh"
      titulo="Você está sem conexão"
      texto="Confira a internet e tente de novo. Sua sacola continua guardada neste aparelho."
    />
  );
}
