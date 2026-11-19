/**
 * Logotipo "<Cidade> Tem": nome da cidade + etiqueta de roupa com pesponto.
 *
 * [DECIDIDO 18/11/2026] A marca NÃO muda de cor no hover. No protótipo, o
 * `a:hover` global pintava o texto de marinho sobre o fundo marinho e o nome
 * da cidade sumia. Aqui as cores ficam nos próprios spans (não herdam do <a>),
 * então nenhum estado de link altera a marca.
 */
export function Marca({ nome, escura = false }: { nome: string; escura?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-[7px] whitespace-nowrap font-titulo text-[22px] font-extrabold leading-none tracking-[-0.02em] ${
        escura ? 'text-marinho' : 'text-branco'
      }`}
    >
      {nome}{' '}
      <span
        className={`relative inline-flex h-7 items-center gap-1.5 rounded-[5px_10px_10px_5px] bg-acento pl-2 pr-2.5 text-lg font-bold text-branco before:h-1.5 before:w-1.5 before:rounded-full before:content-[''] after:pointer-events-none after:absolute after:inset-[3px] after:rounded-[3px_7px_7px_3px] after:border after:border-dashed after:border-branco/55 after:content-[''] ${
          escura ? 'before:bg-linho' : 'before:bg-marinho'
        }`}
      >
        Tem
      </span>
    </span>
  );
}
