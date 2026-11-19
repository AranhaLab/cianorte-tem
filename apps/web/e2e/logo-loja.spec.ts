import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

test.beforeEach(({ page }) => entrarComoLojista(page));

test('lojista cadastra logo, mantém após recarregar e a vê na loja e no anúncio', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ct-comprador-v1',
      JSON.stringify({
        state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
        version: 0,
      }),
    );
  });
  await page.goto('/painel/cadastro');
  const logo = page.getByLabel('Selecionar logo');
  await logo.setInputFiles({
    name: 'logo.webp',
    mimeType: 'image/webp',
    buffer: readFileSync(path.join(__dirname, '../public/marcas/pet-amigo.webp')),
  });
  await expect(page.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Salvar logo' }).click();
  await expect(page.getByText('Logo da loja salva.')).toBeVisible();
  await page.reload();
  await expect(page.getByAltText('Prévia da logo da loja')).toHaveAttribute('src', /^data:image\//);
  await page.goto('/loja/vale-azul');
  await expect(page.locator('img[src^="data:image/"]').first()).toBeVisible();
  await page.goto('/');
  const anuncio = page.locator('[data-anuncio="H1"]').filter({ hasText: 'Confecções Vale Azul' }).first();
  await expect(anuncio.locator('img[src^="data:image/"]')).toHaveCount(1);
  await page.goto('/painel/cadastro');
  await page.getByRole('button', { name: 'Restaurar logo original' }).click();
  await expect(page.getByAltText('Prévia da logo da loja')).toHaveAttribute('src', /marcas\/vale-azul\.webp/);
});

test('logo inválida é rejeitada sem substituir a imagem salva', async ({ page }) => {
  await page.goto('/painel/cadastro');
  await page.getByLabel('Selecionar logo').setInputFiles({
    name: 'logo.webp',
    mimeType: 'image/webp',
    buffer: readFileSync(path.join(__dirname, '../public/marcas/pet-amigo.webp')),
  });
  await expect(page.getByRole('button', { name: 'Salvar logo' })).toBeEnabled();
  await page.getByRole('button', { name: 'Salvar logo' }).click();
  const srcSalvo = await page.getByAltText('Prévia da logo da loja').getAttribute('src');
  await page
    .getByLabel('Selecionar logo')
    .setInputFiles({ name: 'logo.txt', mimeType: 'text/plain', buffer: Buffer.from('arquivo inválido') });
  await expect(page.getByRole('alert').filter({ hasText: 'JPG, PNG ou WebP' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar logo' })).toBeDisabled();
  await expect(page.getByAltText('Prévia da logo da loja')).toHaveAttribute('src', srcSalvo!);
});
