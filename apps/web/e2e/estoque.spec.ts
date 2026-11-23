import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

test.beforeEach(({ page }) => entrarComoLojista(page));

test('produto criado no painel passa a aparecer no estoque', async ({ page }) => {
  await page.goto('/painel/produtos/novo');
  await page.getByLabel('Nome do produto').fill('Camiseta de teste');
  await page.getByLabel('Preço de venda (R$)').fill('49,90');
  await page.getByLabel('SKU', { exact: true }).fill('TESTE-ESTOQUE');
  await page.getByLabel('Estoque (saldo)').fill('12');
  await page.getByLabel('Enviar fotos ou vídeo', { exact: true }).setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.alloc(2048) });
  await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
  await expect(page.getByRole('row', { name: /Camiseta de teste/ })).toBeVisible();
  await page.goto('/painel/estoque');
  await expect(page.getByRole('row', { name: /Camiseta de teste/ })).toContainText('12');
});

test('ajuste manual por variação persiste e a API fica apenas na própria aba', async ({ page }) => {
  await page.goto('/painel/estoque');
  await page.getByRole('button', { name: 'Manual', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API aberta de estoque' })).toHaveCount(0);
  const camisa = page.getByRole('row', { name: /Camisa social/ });
  await camisa.getByRole('button', { name: 'Ajustar' }).click();
  await page.getByRole('button', { name: 'Zerar quantidades' }).click();
  await page.getByRole('button', { name: 'Salvar estoque' }).click();
  await expect(camisa).toContainText('Indisponível');
  await page.reload();
  await expect(camisa).toContainText('Indisponível');
  await camisa.getByRole('button', { name: 'Ajustar' }).click();
  await page.getByLabel(/P · SKU/).fill('30');
  await page.getByRole('button', { name: 'Salvar estoque' }).click();
  await expect(camisa).toContainText('30');
  await expect(camisa).toContainText('Disponível');
  await camisa.getByRole('button', { name: 'Ajustar' }).click();
  await page.getByLabel('Disponibilidade', { exact: true }).selectOption('pausado');
  await page.getByRole('button', { name: 'Salvar estoque' }).click();
  await expect(camisa).toContainText('Indisponível');
  await page.reload();
  await expect(camisa).toContainText('30');
  await expect(camisa).toContainText('Indisponível');
  await page.getByRole('button', { name: 'API aberta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API aberta de estoque' })).toBeVisible();
});

test('importa CSV por SKU e rejeita arquivo inválido sem alterar saldo', async ({ page }) => {
  await page.goto('/painel/estoque');
  await page.getByRole('button', { name: 'Planilha', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'API aberta de estoque' })).toHaveCount(0);
  const camisa = page.getByRole('row', { name: /Camisa social/ });
  await page
    .getByLabel('Arquivo CSV')
    .setInputFiles({
      name: 'estoque.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('sku;quantidade\nVA-CSL-001-P;25\nINEXISTENTE;1'),
    });
  await page.getByRole('button', { name: 'Importar CSV' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'SKU não encontrado' })).toBeVisible();
  await expect(camisa).toContainText('42');
  await page
    .getByLabel('Arquivo CSV')
    .setInputFiles({
      name: 'estoque.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('sku;quantidade\nVA-CSL-001-P;25'),
    });
  await page.getByRole('button', { name: 'Importar CSV' }).click();
  await expect(page.getByRole('status').filter({ hasText: '1 SKU atualizado' })).toBeVisible();
  await expect(camisa).toContainText('56');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar planilha de estoque' }).click();
  expect((await download).suggestedFilename()).toBe('estoque.csv');
  await page.reload();
  await expect(camisa).toContainText('56');
});
