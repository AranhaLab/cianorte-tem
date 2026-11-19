import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

/**
 * Acessibilidade automática (WCAG 2.1 AA via axe): contraste, rótulos, nomes de
 * botões e links, papéis ARIA. Falha em violações "serious" ou "critical".
 * Não substitui teste manual com leitor de tela e teclado.
 */
const PAGINAS = [
  '/',
  '/c/moda',
  '/p/p1',
  '/loja/vale-azul',
  '/sacola',
  '/cadastro',
  '/painel',
  '/painel/anuncios',
  '/painel/produtos/p1',
  '/painel/produtos/novo',
  '/painel/loja',
  '/painel/conversas',
  '/admin',
  '/admin/lojas',
  '/admin/moderacao',
  '/admin/pedidos',
  '/admin/financeiro',
  '/admin/regras',
  '/admin/auditoria',
];

for (const caminho of PAGINAS) {
  test(`sem violações graves de acessibilidade em ${caminho}`, async ({ page, context }) => {
    // Pula o modal de primeira visita e o banner de cookies para auditar a página em si.
    await context.addInitScript(() => {
      localStorage.setItem(
        'ct-comprador-v1',
        JSON.stringify({
          state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
          version: 0,
        }),
      );
    });
    await page.goto(caminho);
    await page.waitForLoadState('networkidle');
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const graves = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      graves.map(
        (v) =>
          `${v.id}: ${v.help} → ${v.nodes
            .map((n) => n.target.join(' '))
            .slice(0, 3)
            .join(' | ')}`,
      ),
    ).toEqual([]);
  });
}

test.beforeEach(({ page }) => entrarComoLojista(page));

test('alvos de toque têm pelo menos 44 px no celular', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'regra de toque vale para o celular');
  await context.addInitScript(() => {
    localStorage.setItem(
      'ct-comprador-v1',
      JSON.stringify({
        state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
        version: 0,
      }),
    );
  });
  await page.goto('/p/p1');
  const pequenos = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('main button, nav[aria-label="Navegação principal"] a')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({
        nome: el.getAttribute('aria-label') ?? el.textContent?.trim(),
        r: el.getBoundingClientRect(),
      }))
      .filter(({ r }) => r.height < 44 || r.width < 44)
      .map(({ nome, r }) => `${nome} (${Math.round(r.width)}×${Math.round(r.height)})`),
  );
  expect(pequenos).toEqual([]);
});
