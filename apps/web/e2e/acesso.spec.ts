import { expect, test } from '@playwright/test';
import { primeiraVisita, abrirMenu } from './ajuda';

test.describe('Telas de acesso (página própria, volta para a origem)', () => {
  test('comprador entra a partir de um produto e volta para ele', async ({ page }) => {
    await primeiraVisita(page);
    await page.goto('/p/p1');
    await page.goto('/entrar?next=%2Fp%2Fp1'); // o mesmo link do botão "Entrar" do cabeçalho

    // Página à parte: sem cabeçalho de categorias, com a foto da cidade ao fundo
    await expect(page.getByRole('navigation', { name: 'Categorias' })).toHaveCount(0);
    await expect(page.locator('img[alt=""][src*="vitrine-cianorte-tem"]').first()).toBeAttached();
    await expect(page.getByRole('heading', { name: 'Entrar', level: 1 })).toBeVisible();

    await page.getByRole('textbox', { name: 'E-mail' }).fill('teste@exemplo.com');
    await page.getByLabel('Senha').fill('Demo12345');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/\/p\/p1$/);
  });

  test('sem origem, volta para o início; destino externo é ignorado', async ({ page }) => {
    await primeiraVisita(page);
    await page.goto('/entrar?next=https%3A%2F%2Fgolpe.com');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('teste@exemplo.com');
    await page.getByLabel('Senha').fill('Demo12345');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
  });

  test('o link de criar conta mantém a tela de origem', async ({ page }) => {
    await page.goto('/entrar?next=%2Fc%2Fmoda');
    await expect(page.getByRole('link', { name: 'Criar conta grátis' })).toHaveAttribute(
      'href',
      '/cadastro?next=%2Fc%2Fmoda',
    );
  });

  test('painel exige login do lojista e volta para a tela pedida', async ({ page }) => {
    await page.goto('/painel/pedidos');
    await expect(page).toHaveURL(/\/lojista\/entrar\?next=%2Fpainel%2Fpedidos$/);
    await expect(page.getByRole('heading', { name: 'Entrar na sua loja' })).toBeVisible();
    await page.getByRole('textbox', { name: 'E-mail' }).fill('loja@exemplo.com');
    await page.getByLabel('Senha').fill('Demo12345');
    await page.getByRole('button', { name: 'Entrar no painel' }).click();
    await expect(page).toHaveURL(/\/painel\/pedidos$/);

    await abrirMenu(page);
    await page.getByRole('button', { name: 'Sair do painel' }).click();
    await expect(page).toHaveURL(/\/lojista\/entrar/);
  });
});
