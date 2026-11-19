import type { Metadata } from 'next';
import Link from 'next/link';
import { FaixaConfianca } from '@/components/vitrine/FaixaConfianca';
import { getTenant } from '@/lib/tenant';

type Props = { params: Promise<{ tenant: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTenant((await params).tenant);
  return {
    title: `Venda no ${t.marca}`,
    description: `Sua loja de ${t.nome} aberta para a cidade inteira, 24 horas por dia. Cadastro com CNPJ, estoque integrado e entrega própria ou retirada.`,
  };
}

/** Landing para lojistas (protótipo: vVender). */
export default async function Vender({ params }: Props) {
  const t = await getTenant((await params).tenant);
  return (
    <>
      <section className="relative mt-4">
        <div className="stitch relative flex min-h-[300px] flex-col justify-center gap-2.5 overflow-hidden rounded-xl bg-marinho px-[22px] py-[26px] text-branco [--r:24px] lg:px-14 lg:py-10">
          <span className="absolute -bottom-10 -right-10 h-60 w-60 rounded-full bg-acento opacity-[.14]" />
          <span className="kicker text-azul-claro">Para lojistas de {t.nome}</span>
          <h2 className="max-w-[520px] text-[26px] leading-[1.1] text-branco lg:text-[40px]">
            Sua loja aberta para a cidade inteira, 24 horas por dia.
          </h2>
          <p className="m-0 max-w-[460px] opacity-90">
            Cadastre seus produtos, ligue o estoque da loja física e venda com entrega própria ou retirada no
            balcão.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/painel/cadastro" className="btn btn-lg bg-branco text-marinho hover:text-marinho">
              Cadastrar minha loja
            </Link>
            <Link
              href="/painel"
              className="btn btn-lg border-[1.5px] border-solid border-branco/40 bg-transparent text-branco hover:text-branco"
            >
              Ver o painel (demo)
            </Link>
          </div>
        </div>
      </section>

      <section className="my-[26px]">
        <h2 className="mb-3.5">Como funciona</h2>
        <FaixaConfianca
          itens={[
            {
              icone: 'doc',
              titulo: '1. Cadastro com CNPJ',
              texto: 'Dados da empresa e da unidade. A equipe aprova em até 2 dias úteis.',
            },
            {
              icone: 'box',
              titulo: '2. Produtos e estoque',
              texto: 'Cadastre à mão, por planilha ou ligue seu sistema pela API.',
            },
            {
              icone: 'eye',
              titulo: '3. Ative a loja',
              texto: 'Um botão deixa a loja visível para os compradores.',
            },
            {
              icone: 'megaphone',
              titulo: '4. Anuncie se quiser',
              texto: 'Escolha uma vaga no mapa do site e dê seu lance.',
            },
          ]}
        />
      </section>

      <section className="card my-[26px] flex flex-col gap-3 border-borda-fria bg-azul-nevoa">
        <h2>Parceria {t.associacao}</h2>
        <span className="text-grafite-2">
          Associados da {t.associacao} têm condições especiais de adesão e apoio para começar a vender.
          [Condições a definir com a associação.]
        </span>
      </section>
    </>
  );
}
