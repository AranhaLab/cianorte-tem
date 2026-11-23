import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

test('desenvolvimento remove service worker antigo antes de iniciar a aplicação', async ({ page }) => {
  await page.goto('/');
  test.skip(
    !(await page.evaluate(() =>
      [...document.scripts].some((script) => script.textContent?.includes('ct-dev-worker-removido')),
    )),
    'Somente no servidor de desenvolvimento',
  );
  await page.evaluate(async () => {
    localStorage.setItem('ct-teste-worker', 'preservado');
    const registro = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }),
      );
    }
    const cache = await caches.open('ct-v2-estatico');
    const script = [...document.scripts].find((s) => s.src.includes('/_next/static/'));
    if (!script) throw new Error('Arquivo da aplicação não encontrado');
    await cache.put(
      script.src,
      new Response('throw new Error("Arquivo antigo em cache")', {
        headers: { 'Content-Type': 'application/javascript' },
      }),
    );
    if (!registro.active) throw new Error('Service worker não ativado');
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length))
    .toBe(0);
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).includes('ct-v2-estatico')))
    .toBe(false);
  await expect(page.getByRole('navigation', { name: 'Categorias e ofertas' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ct-teste-worker'))).toBe('preservado');
});

test('home e menu de categorias funcionam após recarregar', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'ct-comprador-v1',
      JSON.stringify({
        state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
        version: 0,
      }),
    );
  });
  await page.goto('/');
  await page.reload();
  const barra = page.getByRole('navigation', { name: 'Categorias e ofertas' });
  await expect(barra).toBeVisible();
  const menu = barra.getByRole('button', { name: 'Categorias', exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
  }
  expect(erros).toEqual([]);
});

test('navega entre a home e a sacola sem erro na barra de categorias', async ({ page }) => {
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'ct-comprador-v1',
      JSON.stringify({
        state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
        version: 0,
      }),
    );
  });
  await page.goto('/');
  await page
    .getByRole('link', { name: /Sacola/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sacola$/);
  await expect(page.getByRole('navigation', { name: 'Categorias e ofertas' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Categorias e ofertas' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('navigation', { name: 'Categorias e ofertas' })).toBeVisible();
  expect(erros).toEqual([]);
});

test('telas principais abrem e recarregam sem erro de aplicação', async ({ page }) => {
  await entrarComoLojista(page);
  const erros: string[] = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  page.on('response', (resposta) => {
    if (resposta.url().includes('/_next/static/') && resposta.status() >= 400)
      erros.push(`Arquivo da aplicação respondeu ${resposta.status()}: ${resposta.url()}`);
  });
  for (const [caminho, titulo] of [
    ['/categorias', /categorias/i],
    ['/c/moda', /moda e vestuário/i],
    ['/p/p1', /camisa social/i],
    ['/painel/estoque', /estoque e integração/i],
    ['/admin/categorias', /categorias e subcategorias/i],
  ] as const) {
    const resposta = await page.goto(caminho);
    expect(resposta?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: titulo }).first()).toBeVisible();
    const recarregamento = await page.reload();
    expect(recarregamento?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: titulo }).first()).toBeVisible();
  }
  expect(erros).toEqual([]);
});
