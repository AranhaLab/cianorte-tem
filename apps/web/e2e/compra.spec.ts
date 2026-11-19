import { expect, test } from '@playwright/test';
import { aviso, primeiraVisita } from './ajuda';

test.describe('Jornada de compra (CLAUDE.md §5)', () => {
  test('visitante monta sacola em duas lojas, cria conta e paga com Pix', async ({ page }) => {
    await primeiraVisita(page);

    // Produto simples de uma loja
    await page.goto('/p/p6');
    await page.getByRole('button', { name: 'Adicionar à sacola', exact: true }).click();
    const sacola = page.getByRole('dialog', { name: 'Sacola' });
    await expect(sacola).toContainText('Adicionado: Torneira gourmet');
    await page.keyboard.press('Escape');

    // Produto com variação de outra loja: a opção é obrigatória
    await page.goto('/p/p1');
    await page.getByRole('button', { name: 'Adicionar à sacola', exact: true }).click();
    await aviso(page, 'Escolha tamanho antes de adicionar.');
    await page.getByRole('button', { name: 'M', exact: true }).click();
    await page.getByRole('button', { name: 'Comprar agora' }).click();

    // Sacola multiloja, sem login
    await expect(page).toHaveURL(/\/sacola$/);
    await expect(page.getByText('Compra em mais de uma loja')).toBeVisible();
    await expect(page.getByText('Casa & Obra Noroeste')).toBeVisible();
    await expect(page.getByText('Confecções Vale Azul')).toBeVisible();

    // Fechar a compra exige conta; a sacola é mantida
    await page.getByRole('link', { name: 'Continuar a compra' }).click();
    await expect(page).toHaveURL(/\/entrar\?next=checkout/);
    await page.getByRole('link', { name: 'Criar conta grátis' }).click();
    await expect(page).toHaveURL(/\/cadastro\?next=checkout/);

    // LGPD: nenhum consentimento pré-marcado
    for (const caixa of await page.getByRole('checkbox').all()) await expect(caixa).not.toBeChecked();
    await page.getByLabel('Nome completo').fill('Pessoa Teste');
    await page.getByLabel('CPF').fill('529.982.247-25');
    await page.getByLabel('Celular (WhatsApp)').fill('(44) 99999-0000');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('teste@exemplo.com');
    await page.getByLabel('Senha').fill('Demo12345');
    await page.getByRole('checkbox', { name: /Termos de Uso/ }).check();
    await page.getByRole('checkbox', { name: /18 anos/ }).check();
    await page.getByRole('button', { name: 'Criar conta e continuar' }).click();

    // Checkout: Entrega → Pagamento → Revisão
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Finalizar compra' })).toBeVisible();
    await page.getByRole('button', { name: 'Ir para o pagamento' }).click();
    await aviso(page, 'Preencha CEP, rua, número e bairro');
    await page.getByLabel('Bairro').fill('Zona 1');
    await page.getByLabel('Rua').fill('Rua Teste');
    await page.getByLabel('Número').fill('100');
    await page.getByRole('button', { name: 'Ir para o pagamento' }).click();
    await expect(page.getByRole('heading', { name: 'Como você quer pagar?' })).toBeVisible();
    await page.getByRole('button', { name: 'Revisar pedido' }).click();
    await expect(page.getByText('Resumo das condições')).toBeVisible();
    await expect(page.getByText(/desistir em até 7 dias/)).toBeVisible();
    await page.getByRole('button', { name: /Confirmar e pagar R\$ 318,86/ }).click();

    // Pedido principal + subpedidos por loja
    await expect(page).toHaveURL(/\/pedido\/10501$/);
    await expect(page.getByText('10501-A')).toBeVisible();
    await expect(page.getByText('10501-B')).toBeVisible();
    await page.getByRole('button', { name: 'Simular pagamento' }).click();
    await expect(page.getByText('Pagamento confirmado!')).toBeVisible();

    await page.goto('/conta/pedidos');
    await expect(page.getByText('Pedido nº 10501')).toBeVisible();
  });

  test('CEP fora da área bloqueia a compra, inclusive por acesso direto', async ({ page }) => {
    await primeiraVisita(page, '86000000');
    await page.goto('/p/p1');
    await expect(page.locator('main').getByRole('alert')).toContainText('fora da área atendida');
    await expect(page.getByRole('button', { name: 'Adicionar à sacola', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Comprar agora' })).toBeDisabled();
    await expect(page.getByText('Entrega indisponível')).toBeVisible();
  });

  test('comprador nunca vê o saldo numérico do estoque', async ({ page }) => {
    await primeiraVisita(page);
    for (const id of ['p1', 'p3', 'p20']) {
      await page.goto(`/p/${id}`);
      const status = page.locator('main .status').first();
      await expect(status).toHaveText(/^(Disponível|Últimas unidades|Indisponível)$/);
    }
  });

  test('todo anúncio da home tem o rótulo "Patrocinado"', async ({ page }) => {
    await primeiraVisita(page);
    const anuncios = page.locator('a[data-anuncio]');
    expect(await anuncios.count()).toBeGreaterThan(3);
    for (const a of await anuncios.all()) await expect(a).toContainText('Patrocinado');
  });

  test('white label: cada domínio é uma cidade e não enxerga a outra', async ({ page }) => {
    await page.goto('http://maringa.localhost:3200/');
    await expect(page).toHaveTitle(/Maringá Tem/);
    const resposta = await page.goto('http://maringa.localhost:3200/p/p1');
    expect(resposta?.status()).toBe(404);
  });
});
