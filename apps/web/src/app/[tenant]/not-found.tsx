import Link from 'next/link';

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-container flex-col items-center justify-center gap-3 px-4 text-center">
      <h1>Página não encontrada</h1>
      <p className="m-0 text-grafite-2">O endereço pode ter mudado.</p>
      <Link
        href="/"
        className="inline-flex min-h-toque items-center rounded-md bg-azul px-5 font-semibold text-branco hover:bg-azul-escuro"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
