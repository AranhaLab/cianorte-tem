/**
 * Cliente HTTP para o back-end (NestJS). Ainda NÃO é usado: enquanto API_URL
 * não estiver definida, cada módulo de lib/api responde com os mocks.
 *
 * Quando o back-end entrar: em cada função, troque o bloco "mock" por
 * `return http<Tipo>(tenant, 'GET', '/v1/...')`. As assinaturas não mudam.
 */
export const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '';
export const usandoMocks = API_URL === '';

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    message: string,
  ) {
    super(message);
  }
}

interface Opcoes {
  body?: unknown;
  /** Obrigatória em POST /v1/pedidos e PUT de estoque (CLAUDE.md §5.5 e §8). */
  idempotencyKey?: string;
  /** Revalidação ISR (segundos) para leituras públicas de catálogo. */
  revalidate?: number;
}

export async function http<T>(
  tenant: string,
  metodo: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  caminho: string,
  { body, idempotencyKey, revalidate }: Opcoes = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Tenant': tenant };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${API_URL}${caminho}`, {
    method: metodo,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    // Sessão por cookie httpOnly emitido pela API (nunca token em localStorage).
    credentials: 'include',
    ...(revalidate !== undefined ? { next: { revalidate } } : { cache: 'no-store' as const }),
  });

  if (!res.ok) {
    const erro = (await res.json().catch(() => ({}))) as { codigo?: string; mensagem?: string };
    throw new ApiError(res.status, erro.codigo ?? 'erro_desconhecido', erro.mensagem ?? res.statusText);
  }
  return (await res.json()) as T;
}

/** Simula a latência/assincronia da rede nos mocks, para o front já tratar loading. */
export const mock = <T>(valor: T): Promise<T> => Promise.resolve(structuredClone(valor));
