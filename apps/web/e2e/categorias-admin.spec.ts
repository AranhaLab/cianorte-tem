import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

test('admin cria e altera categorias e subcategorias usadas na loja e no painel', async ({ page }) => {
  await entrarComoLojista(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('ct-comprador-v1'))
      localStorage.setItem(
        'ct-comprador-v1',
        JSON.stringify({
          state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
          version: 0,
        }),
      );
  });
  await page.goto('/admin/categorias');
  await page.getByLabel('Nome da categoria').fill('Jardinagem');
  await page.getByLabel('Descrição').fill('Tudo para o jardim');
  await page.getByRole('button', { name: 'Criar categoria' }).click();
  let categoria = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Jardinagem', exact: true }) });
  await expect(categoria).toBeVisible();
  await categoria.getByRole('button', { name: 'Adicionar subcategoria em Jardinagem' }).click();
  await categoria.getByLabel('Nome da subcategoria').fill('Ferramentas de jardim');
  await categoria.getByRole('button', { name: 'Criar subcategoria' }).click();
  await categoria.getByRole('button', { name: 'Ações da subcategoria Ferramentas de jardim' }).click();
  await categoria.getByRole('button', { name: 'Editar Ferramentas de jardim' }).click();
  await categoria.getByLabel('Nome da subcategoria').fill('Ferramentas para jardim');
  await categoria.getByRole('button', { name: 'Salvar subcategoria' }).click();
  await categoria.getByRole('button', { name: 'Ações da categoria Jardinagem' }).click();
  await categoria.getByRole('button', { name: 'Editar Jardinagem' }).click();
  await page.getByLabel('Nome da categoria').fill('Jardim e plantas');
  await page.getByRole('button', { name: 'Salvar categoria' }).click();
  await page.reload();
  categoria = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Jardim e plantas', exact: true }) });
  await expect(categoria).toContainText('Ferramentas para jardim');
  await page.goto('/categorias');
  await page.getByRole('link', { name: /Jardim e plantas/ }).click();
  await expect(page.getByRole('heading', { name: 'Jardim e plantas', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ferramentas para jardim' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Jardim e plantas', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Ferramentas para jardim' }).click();
  await expect(page).toHaveURL(/sub=ferramentas-de-jardim/);
  await page.goto('/painel/produtos/novo');
  await page.getByLabel('Categoria', { exact: true }).selectOption({ label: 'Jardim e plantas' });
  await expect(page.getByLabel('Subcategoria')).toContainText('Ferramentas para jardim');
  await page.goto('/admin/categorias');
  categoria = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Jardim e plantas', exact: true }) });
  page.once('dialog', (dialog) => dialog.accept());
  await categoria.getByRole('button', { name: 'Ações da subcategoria Ferramentas para jardim' }).click();
  await categoria.getByRole('button', { name: 'Excluir Ferramentas para jardim' }).click();
  await expect(categoria.getByText('Ferramentas para jardim')).toHaveCount(0);
  page.once('dialog', (dialog) => dialog.accept());
  await categoria.getByRole('button', { name: 'Ações da categoria Jardim e plantas' }).click();
  await categoria.getByRole('button', { name: 'Excluir Jardim e plantas' }).click();
  await expect(categoria).toHaveCount(0);
  await page.goto('/categorias');
  await expect(page.getByRole('link', { name: /Jardim e plantas/ })).toHaveCount(0);
});

test('categoria e subcategoria vinculadas não são excluídas', async ({ page }) => {
  await page.goto('/admin/categorias');
  const moda = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Moda e vestuário', exact: true }) });
  await moda.getByRole('button', { name: 'Ações da categoria Moda e vestuário' }).click();
  await moda.getByRole('button', { name: 'Excluir Moda e vestuário' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'vinculada a produtos ou lojas' })).toBeVisible();
  await moda.getByRole('button', { name: 'Ações da subcategoria Camisaria' }).click();
  await moda.getByRole('button', { name: 'Excluir Camisaria' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'vinculada a produtos ou lojas' })).toBeVisible();
  await expect(moda).toContainText('Camisaria');
});

test('editar categoria existente mantém sua URL e seus produtos', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('ct-comprador-v1'))
      localStorage.setItem(
        'ct-comprador-v1',
        JSON.stringify({
          state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
          version: 0,
        }),
      );
  });
  await page.goto('/admin/categorias');
  const moda = page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: 'Moda e vestuário', exact: true }) });
  await moda.getByRole('button', { name: 'Ações da categoria Moda e vestuário' }).click();
  await moda.getByRole('button', { name: 'Editar Moda e vestuário' }).click();
  await page.getByLabel('Nome da categoria').fill('Moda local');
  await page.getByRole('button', { name: 'Salvar categoria' }).click();
  await page.goto('/c/moda');
  await expect(page.getByRole('heading', { name: 'Moda local', exact: true })).toBeVisible();
  await expect(page.getByText('Camisa social slim fit algodão').first()).toBeVisible();
  await page.goto('/p/p1');
  await expect(page.getByRole('navigation', { name: 'Você está em' })).toContainText('Moda local');
});
