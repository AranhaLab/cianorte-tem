import { expect, test } from '@playwright/test';
import { aviso } from './ajuda';

test.describe('Painel do lojista (CLAUDE.md §7, §8 e §9)', () => {
  test('pedido só avança pelo fluxo e a loja pode ficar oculta', async ({ page }) => {
    await page.goto('/painel/pedidos');
    const linha = page.getByRole('row', { name: /10482-A/ });
    await expect(linha).toContainText('Pagamento confirmado');
    await linha.getByRole('button', { name: 'Em separação' }).click();
    await aviso(page, 'Pedido 10482-A: Em separação.');
    await expect(linha.getByRole('button', { name: 'Pronto para envio' })).toBeVisible();

    const visivel = page.getByRole('switch', { name: 'Loja visível no marketplace' });
    await expect(visivel).toHaveAttribute('aria-checked', 'true');
    await visivel.click();
    await expect(visivel).toHaveAttribute('aria-checked', 'false');
  });

  test('reserva de segurança muda o que o comprador vê', async ({ page }) => {
    await page.goto('/painel/estoque');
    const camisa = page.getByRole('row', { name: /Camisa social/ });
    await expect(camisa).toContainText('Disponível');
    await page.getByLabel('Reserva de segurança por produto').fill('40');
    await expect(camisa).toContainText('Últimas unidades');
  });

  test('anúncios: lance abaixo do mínimo é recusado; lance válido vira campanha', async ({ page }) => {
    await page.goto('/painel/anuncios');
    await page.getByRole('button', { name: /^H1 · / }).click();
    await expect(page.getByText('Vaga em disputa.')).toBeVisible();

    const valor = page.getByLabel('Valor por dia (R$)');
    await valor.fill('90,00');
    await page.getByRole('button', { name: 'Dar lance' }).click();
    await aviso(page, 'O lance mínimo é R$ 94,00 por dia.');

    await valor.fill('100,00');
    await page.getByRole('button', { name: 'Dar lance' }).click();
    await aviso(page, 'Lance de R$ 100,00/dia registrado.');
    await expect(page.getByRole('row', { name: /H1.*R\$ 100,00.*Lance vencendo/ })).toBeVisible();
  });

  test('vaga livre: valor de tabela respeita o teto de 4 semanas', async ({ page }) => {
    await page.goto('/painel/anuncios?vaga=K1');
    await expect(page.getByRole('heading', { name: 'Topo da categoria' })).toBeVisible();
    await page.getByRole('button', { name: 'Semanas' }).click();
    await expect(page.getByRole('button', { name: /Contratar por R\$ 784,00/ })).toBeVisible();
  });
});
