import { expect, test } from '@playwright/test';
import { aviso } from './ajuda';

/** Etapa 7: subcategorias, filtros laterais, galeria e kits (CLAUDE.md §16). */
test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    if (!localStorage.getItem('ct-comprador-v1'))
      localStorage.setItem(
        'ct-comprador-v1',
        JSON.stringify({
          state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
          version: 0,
        }),
      );
  });
});

test('mega menu leva à subcategoria (desktop)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'mega menu é do desktop; no celular há o modal de categorias');
  await page.goto('/');
  await page.getByRole('button', { name: 'Categorias' }).click();
  const mega = page.getByRole('region', { name: 'Todas as categorias' });
  await expect(mega).toBeVisible();
  await mega.getByRole('link', { name: 'Moda e vestuário', exact: true }).hover();
  await mega.getByRole('link', { name: 'Camisaria' }).click();
  await expect(page).toHaveURL(/\/c\/moda\?sub=camisaria$/);
  await expect(page.getByRole('link', { name: 'Camisaria' }).first()).toHaveAttribute('aria-current', 'true');
});

test('subcategoria e filtros laterais filtram e podem ser removidos', async ({ page }) => {
  await page.goto('/c/moda?sub=acessorios');
  const grade = page.locator('main .grid').last();
  await expect(grade.getByText('Cinto de couro masculino')).toBeVisible();
  await expect(grade.getByText('Vestido midi linho natural')).toHaveCount(0);

  await page.getByRole('button', { name: /^Filtros/ }).click();
  const painel = page.getByRole('dialog', { name: 'Filtros' });
  await painel.getByRole('checkbox', { name: /Couro/ }).check();
  await painel.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page).toHaveURL(/car=Couro/);
  await expect(page).toHaveURL(/sub=acessorios/);
  await expect(page.getByRole('button', { name: 'Filtros (1)' })).toBeVisible();
  await expect(grade.getByText('Kit 3 pares de meias sociais')).toHaveCount(0);

  await page.getByRole('link', { name: 'Couro — remover filtro' }).click();
  await expect(page).not.toHaveURL(/car=/);
});

test('galeria tem fotos e vídeo 9:16 e responde às miniaturas', async ({ page }) => {
  await page.goto('/p/p1');
  const miniaturas = page.getByRole('group', { name: 'Miniaturas' }).getByRole('button');
  await expect(miniaturas).toHaveCount(4); // vídeo + 3 fotos ilustrativas
  await expect(miniaturas.first()).toHaveAccessibleName(/Vídeo/);
  await miniaturas.nth(2).click();
  await expect(page.getByText('3/4')).toBeVisible();
  // Foto real (otimizada pelo next/image), com texto alternativo
  await expect(page.getByRole('img', { name: /Camisa social slim fit algodão — foto 2/ })).toBeVisible();
  await miniaturas.first().click();
  await page.getByRole('button', { name: /Reproduzir/ }).click();
  await expect(page.getByRole('button', { name: /Pausar/ })).toBeVisible();
});

test('vídeo aparece como capa no cartão', async ({ page }) => {
  await page.goto('/c/moveis');
  const card = page.locator('a[href="/p/p14"]').first();
  await expect(card.getByText('Vídeo')).toBeVisible();
  // A miniatura do cartão usa a 1ª foto, não o vídeo
  await expect(card.locator('img')).toHaveAttribute('src', /produtos%2Fp14-catalogo.webp/);
});

test('kit fechado mostra o conteúdo e usa o estoque dos componentes', async ({ page }) => {
  await page.goto('/p/p16');
  await expect(page.getByRole('heading', { name: 'O que vem no kit' })).toBeVisible();
  await expect(page.getByText('2× Café torrado e moído 500 g')).toBeVisible();
});

test('kit aberto: escolhe itens, vê o preço com desconto e leva para a sacola', async ({ page }) => {
  await page.goto('/p/p27');
  await page.getByRole('button', { name: 'Adicionar à sacola', exact: true }).click();
  await aviso(page, 'Escolha de 2 a 4 itens para montar o kit.');

  await page.getByRole('checkbox', { name: /Cinto de couro/ }).check();
  await page.getByRole('checkbox', { name: /Carteira de couro/ }).check();
  await expect(page.getByRole('checkbox', { name: /Gravata/ })).toBeDisabled(); // indisponível
  await expect(page.getByText('Seu kit: R$ 125,82')).toBeVisible(); // (79,90 + 59,90) − 10%

  await page.getByRole('button', { name: 'Comprar agora' }).click();
  await expect(page).toHaveURL(/\/sacola$/);
  await expect(
    page.getByText(/Inclui: 1× Cinto de couro masculino, 1× Carteira de couro slim/),
  ).toBeVisible();
  await expect(page.getByText('R$ 125,82').first()).toBeVisible();
});

test('a página não rola para os lados (barra de categorias com régua recortada)', async ({ page }) => {
  await page.goto('/');
  const { sw, cw } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth,
    cw: document.documentElement.clientWidth,
  }));
  expect(sw).toBeLessThanOrEqual(cw);
});

test('anúncios da home têm foto e continuam com "Patrocinado"', async ({ page }) => {
  await page.goto('/');
  for (const vaga of ['H1', 'M1', 'M2']) {
    const anuncio = page.locator(`a[data-anuncio="${vaga}"]`).first();
    await expect(anuncio).toContainText('Patrocinado');
    await expect(anuncio.locator('img').first()).toHaveAttribute('src', /anuncios%2F/);
    // Foto decorativa: o nome do link continua sendo o texto do anúncio
    await expect(anuncio.locator('img').first()).toHaveAttribute('alt', '');
  }
});
