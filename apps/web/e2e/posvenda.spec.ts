import { expect, test, type Page } from '@playwright/test';
import { aviso, primeiraVisita } from './ajuda';

/** Compra o e-book (p35) com cadastro e Pix, até a página do pedido. */
async function comprarEbook(page: Page, cep = '87200000') {
  await primeiraVisita(page, cep);
  await page.goto('/p/p35');
  await expect(page.getByText('Entrega digital · sem frete')).toBeVisible();
  await page.getByRole('button', { name: 'Comprar agora' }).click();
  await page.getByRole('link', { name: 'Continuar a compra' }).click();
  await page.getByRole('link', { name: 'Criar conta grátis' }).click();
  await page.getByLabel('Nome completo').fill('Pessoa Teste');
  await page.getByLabel('CPF').fill('529.982.247-25');
  await page.getByLabel('Celular (WhatsApp)').fill('(44) 99999-0000');
  await page.getByRole('textbox', { name: 'E-mail' }).fill('teste@exemplo.com');
  await page.getByLabel('Senha').fill('Demo12345');
  await page.getByRole('checkbox', { name: /Termos de Uso/ }).check();
  await page.getByRole('checkbox', { name: /18 anos/ }).check();
  await page.getByRole('button', { name: 'Criar conta e continuar' }).click();

  // Só digital: sem endereço nem frete
  await expect(page).toHaveURL(/\/checkout$/);
  await expect(page.getByText('Entrega digital · sem frete').first()).toBeVisible();
  await expect(page.getByLabel('Rua')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ir para o pagamento' }).click();
  await page.getByRole('button', { name: 'Revisar pedido' }).click();
  await page.getByRole('button', { name: /Confirmar e pagar/ }).click();
  await expect(page).toHaveURL(/\/pedido\/\d+$/);
}

test.describe('Pós-compra (etapa 8)', () => {
  test('produto digital: sem frete, download só depois do pagamento', async ({ page }) => {
    await comprarEbook(page);
    await expect(page.getByText('Conversa com a loja abre após o pagamento')).toBeVisible();

    await page.goto('/conta/downloads');
    await expect(page.getByText('Liberado após a confirmação do pagamento')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Baixar' })).toBeDisabled();

    await page.goBack();
    await expect(page).toHaveURL(/\/pedido\/\d+$/);
    await page.getByRole('button', { name: 'Simular pagamento' }).click();
    await expect(page.getByText('Pagamento confirmado!')).toBeVisible();

    await page.goto('/conta/downloads');
    await expect(page.getByText(/5 de 5 downloads restantes/)).toBeVisible();
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Baixar' }).click();
    expect((await download).suggestedFilename()).toMatch(/-demonstracao\.txt$/);
    await expect(page.getByText(/4 de 5 downloads restantes/)).toBeVisible();
  });

  test('digital não é bloqueado por CEP fora da área', async ({ page }) => {
    await primeiraVisita(page, '86000000');
    await page.goto('/p/p35');
    await expect(page.locator('main').getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Comprar agora' })).toBeEnabled();
  });

  test('chat: abre após o pagamento, recusa imagem grande e a loja vê a mensagem', async ({ page }) => {
    await comprarEbook(page);
    await page.getByRole('button', { name: 'Simular pagamento' }).click();
    await page.getByRole('link', { name: 'Conversar com a loja' }).first().click();
    await expect(page).toHaveURL(/\/chat\//);

    // Imagem acima de 5 MB é recusada
    await page.getByLabel('Anexar imagem (até 5 MB)').setInputFiles({
      name: 'grande.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(5_000_001),
    });
    await aviso(page, 'A imagem passa de 5 MB');

    await page.getByLabel('Mensagem').fill('O arquivo vem com o molde em A4?');
    await page.getByRole('button', { name: 'Enviar' }).click();
    const lista = page.getByRole('list', { name: /Mensagens com/ });
    await expect(lista).toContainText('O arquivo vem com o molde em A4?');
    await expect(lista).toContainText('resposta automática da demonstração');

    // A loja do e-book (Lar Bordado) vê a conversa no painel, se for a loja do painel;
    // a loja da demonstração é a Vale Azul, que tem as suas próprias conversas.
    await page.goto('/painel/conversas');
    await expect(page.getByRole('navigation', { name: 'Conversas' })).toContainText('10482-A');
    await expect(page.getByRole('navigation', { name: 'Conversas' })).not.toContainText('Pessoa Teste');
  });

  test('painel: lojista responde e a conversa fica lida', async ({ page }) => {
    await page.goto('/painel/conversas?c=10482-A');
    await expect(page.getByRole('list', { name: 'Mensagens com Comprador #1' })).toContainText(
      'Pode trocar para G',
    );
    await page.getByLabel('Mensagem').fill('Trocado para G. Sai hoje!');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('list', { name: /Mensagens com/ })).toContainText('Trocado para G');
    await expect(page.getByLabel(/não lidas/)).toHaveCount(0);
  });
});
