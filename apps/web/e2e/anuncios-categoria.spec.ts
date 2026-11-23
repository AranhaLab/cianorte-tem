import { expect, test } from '@playwright/test';
import { primeiraVisita } from './ajuda';

test('anúncios da categoria e o destaque de móveis aparecem nas posições corretas', async ({ page }) => {
  await primeiraVisita(page);
  await page.goto('/c/mercado');
  await expect(page.locator('[data-anuncio="K1"]')).toContainText('Mercado Bom Preço');
  await expect(page.locator('[data-anuncio="L1"]').first()).toContainText('Mercado Bom Preço');
  await expect(
    page.locator('main').getByText('Sala nova até o Natal').filter({ visible: true }),
  ).toBeVisible();
  await page.goto('/c/moda');
  await expect(page.locator('[data-anuncio="K1"]')).toContainText('Confecções Vale Azul');
  await expect(page.locator('[data-anuncio="L1"]').first()).toContainText('Confecções Vale Azul');
});

test('carrossel principal tem controles manuais e rotação automática', async ({ page }) => {
  await primeiraVisita(page);
  const trilho = page.getByLabel('Destaques patrocinados');
  const antes = await trilho.evaluate((el) => el.scrollLeft);
  await page.getByRole('button', { name: 'Próximo anúncio' }).click();
  await expect.poll(() => trilho.evaluate((el) => el.scrollLeft)).toBeGreaterThan(antes);
  await page.getByRole('button', { name: 'Próximo anúncio' }).blur();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(1000);
  const depois = await trilho.evaluate((el) => el.scrollLeft);
  await expect.poll(() => trilho.evaluate((el) => el.scrollLeft), { timeout: 10000 }).not.toBe(depois);
});

test('filtros cabem na categoria e o carrossel de produtos responde às setas', async ({ page }) => {
  await primeiraVisita(page);
  await page.goto('/c/moda');
  const filtros = page.getByRole('toolbar', { name: 'Ordenar e filtrar' });
  const largura = await filtros.evaluate((el) => ({ cliente: el.clientWidth, conteudo: el.scrollWidth }));
  expect(largura.conteudo).toBeLessThanOrEqual(largura.cliente);
  const lista = page.getByRole('list', { name: 'Mais vendidos em moda e vestuário' });
  await page.getByRole('button', { name: 'Próximos de Mais vendidos em moda e vestuário' }).click();
  await expect.poll(() => lista.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test('cada categoria tem anúncios com imagem e vitrines preenchidas', async ({ page }) => {
  await primeiraVisita(page);
  for (const id of [
    'moda',
    'construcao',
    'cama-mesa-banho',
    'moveis',
    'mercado',
    'eletronicos',
    'esporte',
    'beleza',
    'infantil',
    'digitais',
    'pet',
  ]) {
    await page.goto(`/c/${id}`);
    await expect(page.locator('[data-anuncio="K1"] img').first()).toBeVisible();
    await expect(page.locator('[data-anuncio="L1"] img').first()).toHaveCount(1);
    const maisVendidos = page.getByRole('list', { name: /^Mais vendidos em/ });
    expect(await maisVendidos.getByRole('listitem').count()).toBeGreaterThanOrEqual(6);
  }
});
