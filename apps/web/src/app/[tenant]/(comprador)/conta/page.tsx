import { redirect } from 'next/navigation';

/** /conta abre a primeira aba. A exigência de login é tratada na etapa 4. */
export default function ContaIndex() {
  redirect('/conta/dados');
}
