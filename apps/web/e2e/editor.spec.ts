import { expect, test } from '@playwright/test';
import { aviso, entrarComoLojista, abrirMenu } from './ajuda';

const foto = { name: 'camiseta-frente.png', mimeType: 'image/png', buffer: Buffer.alloc(2048) };

test.beforeEach(({ page }) => entrarComoLojista(page));

test.describe('Editor de produto e logística (etapa 9)', () => {
  test('preço vale na hora; nome vai para a moderação; aprovar mantém o preço', async ({ page }) => {
    await page.goto('/painel/produtos');
    await page.getByRole('link', { name: 'Editar Camisa social slim fit algodão' }).click();
    await expect(page.getByRole('heading', { name: 'Editar produto' })).toBeVisible();

    await page.getByLabel('Preço de venda (R$)').fill('79,90');
    await expect(page.getByText('Vale na hora: preço.')).toBeVisible();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await aviso(page, 'Preço e estoque atualizados na hora.');
    const linha = page.getByRole('row', { name: /Camisa social slim fit/ });
    await expect(linha).toContainText('R$ 79,90');
    await expect(linha).toContainText('Publicado');

    await linha.getByRole('link', { name: /^Editar/ }).click();
    await page.getByLabel('Nome do produto').fill('Camisa social slim fit 100% algodão');
    await expect(page.getByText(/Vai para a moderação: nome/)).toBeVisible();
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await aviso(page, 'Alteração enviada para moderação.');
    // A vitrine continua com o nome publicado até a aprovação
    await expect(page.getByRole('row', { name: /Camisa social slim fit algodão/ })).toContainText(
      'Alteração em análise',
    );

    await page.getByRole('link', { name: 'Editar Camisa social slim fit algodão' }).click();
    await expect(page.getByText('Aguardando moderação: nome.', { exact: false })).toBeVisible();
    await page.getByRole('button', { name: 'Simular aprovação' }).click();
    const aprovada = page.getByRole('row', { name: /100% algodão/ });
    await expect(aprovada).toContainText('Publicado');
    await expect(aprovada).toContainText('R$ 79,90');
  });

  test('novo produto: valida, recusa SKU repetido e vai para análise', async ({ page }) => {
    await page.goto('/painel/produtos/novo');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await aviso(page, 'Confira os campos destacados.');
    await expect(page.getByText('Use de 3 a 120 caracteres.')).toBeVisible();
    await expect(page.getByText('Envie pelo menos uma foto.')).toBeVisible();

    await page.getByLabel('Nome do produto').fill('Camiseta básica algodão');
    await page.getByLabel('Preço de venda (R$)').fill('49,90');
    await page.getByLabel('SKU', { exact: true }).fill('VA-CSL-001');
    await page.getByLabel('Enviar fotos ou vídeo', { exact: true }).setInputFiles(foto);
    await expect(page.getByRole('list', { name: 'Galeria (em ordem)' })).toContainText('Capa');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await expect(page.getByText('Este SKU já é usado em outro produto da loja.')).toBeVisible();

    await page.getByLabel('SKU', { exact: true }).fill('VA-CAM-100');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await aviso(page, 'Produto enviado para moderação.');
    await expect(page.getByRole('row', { name: /Camiseta básica algodão/ })).toContainText(
      'Novo · em análise',
    );
  });

  test('variações e kit: regras do PRD-05', async ({ page }) => {
    await page.goto('/painel/produtos/novo');
    await page.getByLabel('Nome do produto').fill('Kit teste');
    await page.getByLabel('Preço de venda (R$)').fill('150');
    await page.getByLabel('Enviar fotos ou vídeo', { exact: true }).setInputFiles(foto);

    await page.getByText('Com variações', { exact: true }).click();
    await page.getByRole('button', { name: 'Adicionar opção' }).click();
    await page.getByLabel('Nome da opção 1').fill('P');
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await expect(page.getByText('Cadastre pelo menos 2 opções.')).toBeVisible();

    await page.getByText('Kit', { exact: true }).click();
    await page.getByRole('checkbox', { name: /Camisa social slim fit/ }).check();
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await expect(page.getByText('Escolha pelo menos 2 produtos diferentes da sua loja.')).toBeVisible();
    await page.getByRole('checkbox', { name: /Calça jeans/ }).check();
    await expect(page.getByText(/Separados, os itens custam/)).toBeVisible();
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await aviso(page, 'Produto enviado para moderação.');
  });

  test('logística: trajeto de teste respeita cidade e distância máxima', async ({ page }) => {
    await page.goto('/painel/loja');
    // Carregamento direto: o menu marca a tela certa (caminho sem o segmento da cidade)
    await abrirMenu(page);
    await expect(page.getByRole('link', { name: 'Minha loja', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    const cep = page.getByLabel('CEP do comprador');
    await cep.fill('86000-000');
    await page.getByRole('button', { name: 'Simular' }).click();
    await expect(page.getByText('Este CEP fica fora da área atendida pela cidade.')).toBeVisible();

    await cep.fill('87200-000');
    await page.getByRole('button', { name: 'Simular' }).click();
    await expect(page.getByText(/3,8 km · frete R\$/)).toBeVisible();

    await page.getByLabel('Distância máxima de entrega (km)').fill('2');
    await page.getByRole('button', { name: 'Simular' }).click();
    await expect(page.getByText(/Fora da sua distância máxima de entrega/)).toBeVisible();

    await page.getByLabel('Distância máxima de entrega (km)').fill('80');
    await page.getByRole('button', { name: 'Salvar logística' }).click();
    await expect(page.getByText('Distância entre 1 e 50 km.')).toBeVisible();
    await page.getByLabel('Distância máxima de entrega (km)').fill('12');
    await page.getByLabel('Horário de corte').fill('16:30');
    await page.getByRole('button', { name: 'Salvar logística' }).click();
    await aviso(page, 'O novo corte vale para as próximas compras.');
  });

  test('filial nova entra em análise', async ({ page }) => {
    await page.goto('/painel/loja');
    await page.getByRole('button', { name: 'Adicionar filial' }).click();
    const form = page.getByRole('form', { name: 'Nova unidade' });
    await form.getByLabel('Nome da unidade').fill('Vale Azul Shopping');
    await form.getByLabel('CEP').fill('87200-100');
    await form.getByLabel('Endereço (rua e número)').fill('Av. Brasil, 1000');
    await form.getByLabel('Bairro').fill('Zona 1');
    await form.getByRole('button', { name: 'Enviar para análise' }).click();
    await aviso(page, 'Ela só vende depois de aprovada.');
    const unidades = page.getByRole('region', { name: 'Unidades' });
    await expect(unidades).toContainText('Vale Azul Shopping');
    await expect(unidades).toContainText('Em análise');
  });
});
