import { expect, test } from '@playwright/test';
import { entrarComoLojista } from './ajuda';

test.beforeEach(async ({ page }) => {
  await entrarComoLojista(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      'ct-comprador-v1',
      JSON.stringify({
        state: { cep: '87200-000', cepConfirmado: true, cookies: 'necessarios' },
        version: 0,
      }),
    ),
  );
});

test('admin configura uma tela de acesso e uma campanha patrocinada por período', async ({ page }) => {
  await page.goto('/admin/acesso');
  await page.getByLabel('Título', { exact: true }).fill('Uma campanha local');
  await page.getByLabel('Complemento do título').fill('para a sua cidade.');
  await page.getByLabel('Texto de apoio').fill('Uma mensagem escolhida pelo administrador.');
  await page.getByLabel('Título do formulário (opcional)').fill('Acesse sua conta local');
  await page.getByLabel('Texto do formulário (opcional)').fill('Bem-vindo à campanha.');
  await page.getByLabel('Fundo do formulário').fill('#eeeeee');
  await page.getByLabel('Botão principal').fill('#123456');
  await page
    .getByLabel('Imagem de fundo')
    .setInputFiles({ name: 'invalida.png', mimeType: 'image/png', buffer: Buffer.from('não é uma imagem') });
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível abrir a imagem' })).toBeVisible();
  await page.getByLabel('Imagem de fundo').setInputFiles({
    name: 'fundo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC4sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByLabel('Exibir textos, tópicos e selos também no celular').check();
  await page.getByLabel('Título do tópico 1').fill('Apoio ao comércio');
  await page.getByLabel('Exibir campanha nesta tela').check();
  await page.getByLabel('Identificar como patrocinado').check();
  await page.getByLabel('Nome do anunciante').fill('Loja Exemplo');
  await page.getByLabel('Título do banner').fill('Semana especial');
  await page.getByLabel('Início da campanha').fill('2000-01-01');
  await page.getByLabel('Fim da campanha').fill('2099-12-31');
  await page.getByLabel('Imagem do banner').setInputFiles({
    name: 'banner.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aC4sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Salvar configuração' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Configuração da tela de acesso salva' }),
  ).toBeVisible();
  await page.goto('/entrar');
  await expect(page.getByRole('heading', { name: 'Acesse sua conta local' })).toBeVisible();
  await expect(page.getByText('Bem-vindo à campanha.')).toBeVisible();
  await expect(page.getByText('Uma campanha local')).toBeVisible();
  await expect(page.locator('.acesso-form-personalizado')).toHaveCSS(
    'background-color',
    'rgb(238, 238, 238)',
  );
  await expect(page.locator('.acesso-form-personalizado .btn-primary').first()).toHaveCSS(
    'background-color',
    'rgb(18, 52, 86)',
  );
  await expect(page.getByText('Apoio ao comércio')).toBeVisible();
  await expect(page.getByText('Semana especial')).toBeVisible();
  await expect(page.getByText('Patrocinado · Loja Exemplo')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Semana especial')).toBeVisible();
  await page.goto('/cadastro');
  await expect(page.getByText('Semana especial')).toHaveCount(0);
  await page.goto('/admin/acesso');
  await page.getByLabel('Tela para configurar').selectOption('cadastro');
  await page.getByLabel('Título', { exact: true }).fill('');
  await page.getByLabel('Complemento do título').fill('');
  await page.getByLabel('Texto de apoio').fill('');
  await page.getByRole('button', { name: 'Salvar configuração' }).click();
  await page.goto('/cadastro');
  await expect(page.getByText('Crie sua conta e compre')).toHaveCount(0);
  await page.goto('/admin/acesso');
  await page.getByLabel('Tela para configurar').selectOption('lojista-entrar');
  await page.getByLabel('Título', { exact: true }).fill('Campanha para lojistas');
  await page.getByLabel('Exibir textos, tópicos e selos também no celular').check();
  await page.getByRole('button', { name: 'Salvar configuração' }).click();
  await page.goto('/lojista/entrar');
  await expect(page.getByText('Campanha para lojistas')).toBeVisible();
  await expect(page.getByText('Semana especial')).toHaveCount(0);
  await page.goto('/lojista/cadastro');
  await expect(page.getByText('Campanha para lojistas')).toHaveCount(0);
});

test('atributos e variações aprovados viram filtros da categoria', async ({ page }) => {
  await page.goto('/painel/produtos');
  await page.getByRole('link', { name: 'Editar Camisa social slim fit algodão' }).click();
  await page.getByLabel('Atributo', { exact: true }).fill('Material especial');
  await page.getByLabel('Valor do atributo').fill('Linho local');
  await page.getByRole('button', { name: 'Adicionar atributo' }).click();
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await page
    .getByRole('row', { name: /Camisa social slim fit/ })
    .getByRole('link', { name: /^Editar/ })
    .click();
  await page.getByRole('button', { name: 'Simular aprovação' }).click();
  await page.goto('/c/moda');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await expect(page.getByRole('group', { name: 'Material especial' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Tamanho' })).toBeVisible();
  await page.getByLabel(/Linho local/).check();
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByRole('link', { name: /Camisa social slim fit algodão/ }).first()).toBeVisible();
  await expect(
    page.getByRole('link', { name: /Material especial: Linho local — remover filtro/ }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('link', { name: /Material especial: Linho local — remover filtro/ }),
  ).toBeVisible();
});

test('produto novo gera filtros somente depois da aprovação', async ({ page }) => {
  await page.goto('/painel/produtos/novo');
  await page.getByLabel('Nome do produto').fill('Camisa com acabamento especial');
  await page.getByLabel('Preço de venda (R$)').fill('89,90');
  await page
    .getByLabel('Enviar fotos ou vídeo', { exact: true })
    .setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: Buffer.alloc(2048) });
  await page.getByLabel('Atributo', { exact: true }).fill('Acabamento');
  await page.getByLabel('Valor do atributo').fill('Bordado local');
  await page.getByRole('button', { name: 'Adicionar atributo' }).click();
  await page.getByText('Com variações', { exact: true }).click();
  await page.getByLabel('Nome da variação').fill('Cor exclusiva');
  await page.getByRole('button', { name: 'Adicionar opção' }).click();
  await page.getByRole('button', { name: 'Adicionar opção' }).click();
  await page.getByLabel('Nome da opção 1').fill('Azul local');
  await page.getByLabel('SKU da opção Azul local').fill('CAM-AZ-901');
  await page.getByLabel('Estoque da opção Azul local').fill('8');
  await page.getByLabel('Nome da opção 2').fill('Verde local');
  await page.getByLabel('SKU da opção Verde local').fill('CAM-VD-902');
  await page.getByLabel('Estoque da opção Verde local').fill('8');
  await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
  await expect(page.getByRole('row', { name: /Camisa com acabamento especial/ })).toContainText(
    'Novo · em análise',
  );
  await page.goto('/c/moda');
  await expect(page.getByRole('link', { name: /Camisa com acabamento especial/ })).toHaveCount(0);
  await page.goto('/painel/produtos');
  await page
    .getByRole('row', { name: /Camisa com acabamento especial/ })
    .getByRole('link', { name: /^Editar/ })
    .click();
  await page.getByRole('button', { name: 'Simular aprovação' }).click();
  await page.goto('/c/moda');
  await page.getByRole('button', { name: /^Filtros/ }).click();
  await expect(page.getByRole('group', { name: 'Cor exclusiva' })).toBeVisible();
  await page.getByLabel(/Azul local/).check();
  await page.getByLabel(/Bordado local/).check();
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await page
    .getByRole('link', { name: /Camisa com acabamento especial/ })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Camisa com acabamento especial' })).toBeVisible();
  await expect(page.getByText(/compra de produtos cadastrados no navegador/)).toBeVisible();
});
