import { notFound } from 'next/navigation';
import { Marca } from '@/components/marca/Marca';
import { getTenant } from '@/lib/tenant';

/**
 * Vitrine de tokens (só em desenvolvimento/demo). Serve para conferir a
 * paleta, as fontes e a marca de cada cidade: /dev/tokens em cada subdomínio.
 */
export const metadata = { title: 'Tokens', robots: { index: false } };

const CORES: Array<[string, string, string]> = [
  ['bg-marinho', 'marinho', 'cabeçalho, rodapé, títulos, item ativo'],
  ['bg-marinho-2', 'marinho-2', 'hover sobre marinho'],
  ['bg-azul', 'azul', 'botões, links, foco'],
  ['bg-azul-escuro', 'azul-escuro', 'hover de botão'],
  ['bg-azul-nevoa', 'azul-nevoa', 'fundos de apoio'],
  ['bg-acento', 'acento (cidade)', 'etiqueta "Tem", ofertas, alertas'],
  ['bg-acento-claro', 'acento-claro', 'fundo de alerta'],
  ['bg-verde', 'verde', '"Loja da cidade", entrega, sucesso'],
  ['bg-verde-claro', 'verde-claro', 'fundo de sucesso'],
  ['bg-aviso-claro', 'aviso-claro', 'fundo de atenção'],
  ['bg-linho', 'linho', 'fundo da página'],
  ['bg-grafite', 'grafite', 'texto'],
  ['bg-grafite-2', 'grafite-2', 'texto secundário'],
  ['bg-borda', 'borda', 'divisórias'],
  ['bg-neutro-200', 'neutro-200', 'trilhos, linhas de tabela'],
];

export default async function Tokens({ params }: { params: Promise<{ tenant: string }> }) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') notFound();
  const t = await getTenant((await params).tenant);

  return (
    <main className="mx-auto flex max-w-container flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-1">
        <span className="text-xs font-bold uppercase tracking-[.1em] text-azul">
          Etapa 1 · tokens e white label
        </span>
        <h1>{t.marca}</h1>
        <p className="m-0 text-grafite-2">
          Cidade resolvida pelo domínio: <b>{t.slug}</b> · associação {t.associacao} · CEPs{' '}
          {t.cepsAtendidos[0]}…
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2>Marca</h2>
        <div className="flex flex-wrap items-center gap-6">
          <div className="rounded-lg bg-marinho px-6 py-5">
            <Marca nome={t.nome} />
          </div>
          <div className="rounded-lg border border-borda bg-branco px-6 py-5">
            <Marca nome={t.nome} escura />
          </div>
        </div>
        <p className="m-0 text-sm text-grafite-2">
          Passe o mouse: a marca não muda de cor (ajuste pedido em 18/11).
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Cores</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CORES.map(([cls, nome, uso]) => (
            <div key={nome} className="overflow-hidden rounded-md border border-borda bg-branco shadow-1">
              <div className={`h-16 ${cls}`} />
              <div className="flex flex-col p-3">
                <b className="text-sm text-marinho">{nome}</b>
                <span className="text-xs text-grafite-2">{uso}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Tipografia</h2>
        <p className="m-0 font-titulo text-3xl font-extrabold text-marinho">
          Outfit — títulos e preços R$ 89,90
        </p>
        <p className="m-0 font-ui text-base">Inter — interface, textos e formulários.</p>
      </section>

      <section className="flex flex-col gap-3">
        <h2>Raios e sombras</h2>
        <div className="flex flex-wrap gap-4">
          {['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'].map((r) => (
            <div
              key={r}
              className={`flex h-20 w-28 items-center justify-center bg-branco text-xs shadow-1 ${r}`}
            >
              {r}
            </div>
          ))}
          <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-branco text-xs shadow-2">
            shadow-2
          </div>
        </div>
      </section>
    </main>
  );
}
