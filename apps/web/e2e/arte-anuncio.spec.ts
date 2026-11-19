import { expect, test } from '@playwright/test';
import path from 'node:path';
import { aviso, entrarComoLojista } from './ajuda';

test.beforeEach(({ page }) => entrarComoLojista(page));

const ARTE_M1 = path.join(__dirname, '..', 'public', 'anuncios', 'm1-enxoval.webp'); // 1600 × 400

test.describe('Arte do anúncio (só depois da compra)', () => {
  test('lance em disputa não libera o envio da arte', async ({ page }) => {
    await page.goto('/painel/anuncios/arte/cp1');
    await expect(page.getByText('A arte é enviada depois da compra')).toBeVisible();
    await expect(page.getByLabel('Imagem do anúncio')).toHaveCount(0);
  });

  test('lance vencido libera "Enviar arte"', async ({ page }) => {
    await page.goto('/painel/anuncios');
    const h1 = page.getByRole('row', { name: /H1/ }).first();
    await expect(h1).toContainText('Lance vencendo');
    await expect(h1.getByRole('link', { name: 'Enviar arte' })).toHaveCount(0);
    await h1.getByRole('button', { name: 'Simular: venceu' }).click();
    await expect(h1).toContainText('Aguardando arte');
    await expect(h1.getByRole('link', { name: 'Enviar arte' })).toBeVisible();
  });

  test('compra direta → arte ajustada → moderação → no ar', async ({ page }) => {
    await page.goto('/painel/anuncios');
    await page.getByRole('row', { name: /M1/ }).getByRole('link', { name: 'Enviar arte' }).click();
    await expect(page.getByRole('heading', { name: 'Enviar arte do anúncio' })).toBeVisible();

    await page.getByLabel('Imagem do anúncio').setInputFiles(ARTE_M1);
    await expect(page.getByText('Nitidez boa')).toBeVisible();
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await expect(page.getByText('Escreva o título.')).toBeVisible();

    await page.getByLabel('Título').fill('Enxoval bordado à mão');
    await page.getByText('Degradê na cor da marca').click();
    await page.getByLabel('Zoom').fill('120');
    // A prévia usa o componente da vitrine, já com o selo da loja
    const previa = page.getByRole('region', { name: 'Simulação da vaga' });
    await expect(previa).toContainText('Patrocinado');
    await expect(previa).toContainText('Confecções Vale Azul');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await aviso(page, 'Arte enviada para aprovação.');
    await expect(page.getByRole('row', { name: /M1/ })).toContainText('Arte em análise');

    // Admin modera com a prévia
    await page.goto('/admin/moderacao');
    const arte = page.getByRole('article', { name: /Arte M1/ });
    await expect(arte).toContainText('Enxoval bordado à mão');
    await arte.getByRole('button', { name: 'Aprovar arte' }).click();
    await aviso(page, 'Arte aprovada.');

    await page.goto('/painel/anuncios');
    await expect(page.getByRole('row', { name: /M1/ })).toContainText('No ar');
  });

  test('arte reprovada mostra o motivo e permite reenviar', async ({ page }) => {
    await page.goto('/painel/anuncios/arte/cp2');
    await page.getByLabel('Imagem do anúncio').setInputFiles(ARTE_M1);
    await page.getByLabel('Título').fill('Promoção imperdível só hoje');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();

    await page.goto('/admin/moderacao');
    const arte = page.getByRole('article', { name: /Arte M1/ });
    await arte.getByRole('button', { name: 'Reprovar arte', exact: true }).click();
    await arte.getByLabel(/Motivo/).fill('Texto promete prazo que a loja não informa no anúncio.');
    await arte.getByRole('button', { name: 'Confirmar reprovação' }).click();

    await page.goto('/painel/anuncios');
    const m1 = page.getByRole('row', { name: /M1/ });
    await expect(m1).toContainText('Arte reprovada');
    await expect(m1).toContainText('Texto promete prazo');
    await expect(m1.getByRole('link', { name: 'Reenviar arte' })).toBeVisible();
  });
});
