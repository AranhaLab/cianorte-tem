import Link from 'next/link';
import { Marca } from '@/components/marca/Marca';
import type { Tenant } from '@/types/domain';

/** Rodapé com identificação do fornecedor/operadora (Decreto 7.962/2013). */
export function Rodape({ tenant }: { tenant: Tenant }) {
  const colunas: Array<[string, Array<[string, string]>]> = [
    [
      'Comprar',
      [
        ['Categorias', '/categorias'],
        ['Ofertas', '/ofertas'],
        ['Lojas da cidade', '/lojas'],
        ['Meus pedidos', '/conta/pedidos'],
      ],
    ],
    [
      'Vender',
      [
        ['Seja um lojista', '/vender'],
        ['Painel do lojista', '/painel'],
        ['Anuncie aqui', '/painel/anuncios'],
      ],
    ],
    [
      'Ajuda e legal',
      [
        ['Termos de uso', '/termos'],
        ['Privacidade (LGPD)', '/privacidade'],
        ['Trocas e arrependimento', '/termos#trocas'],
        ['Cookies', '/privacidade#cookies'],
      ],
    ],
  ];
  return (
    <footer className="mt-10 bg-marinho pb-7 pt-8 text-[13px] text-sobre-marinho">
      <div className="mx-auto grid max-w-container grid-cols-2 gap-5 px-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <Marca nome={tenant.logo.nome} etiqueta={tenant.logo.etiqueta} />
          <span>
            {tenant.slogan} Marketplace regional com lojas de {tenant.nome} e região, em parceria com a{' '}
            {tenant.associacao}.
          </span>
          <span className="text-xs">
            {tenant.razaoSocialOperadora} · CNPJ {tenant.cnpjOperadora} · {tenant.enderecoOperadora}
          </span>
        </div>
        {colunas.map(([titulo, links]) => (
          <div key={titulo}>
            <h4 className="m-0 mb-2.5 font-titulo text-[15px] text-branco">{titulo}</h4>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {links.map(([rotulo, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sobre-marinho-claro hover:text-branco">
                    {rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
