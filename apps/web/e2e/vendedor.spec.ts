import { expect, test, type Page } from '@playwright/test';
import { aviso, primeiraVisita } from './ajuda';

const documento = {
  name: 'cartao-cnpj.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4 demo'),
};

async function continuar(page: Page) {
  await page.getByRole('button', { name: 'Continuar' }).click();
}

test.describe('Lojista novo: adesão e cadastro em etapas', () => {
  test('cria a conta, completa as etapas, envia e é aprovado', async ({ page }) => {
    await primeiraVisita(page);
    await page.goto('/vender');
    await page.getByRole('link', { name: 'Cadastrar minha loja' }).click();
    await expect(page).toHaveURL(/\/lojista\/cadastro$/);

    await page.getByRole('button', { name: 'Criar conta e continuar' }).click();
    await expect(page.locator('main').getByRole('alert')).toContainText('CNPJ inválido.');

    await page.getByLabel('Nome da loja').fill('Moda Exemplo');
    await page.getByLabel('CNPJ').fill('11222333000181');
    await expect(page.getByLabel('CNPJ')).toHaveValue('11.222.333/0001-81');
    await page.getByLabel('Seu nome (responsável)').fill('Pessoa Teste');
    await page.getByRole('textbox', { name: 'E-mail' }).fill('loja@exemplo.com');
    await page.getByLabel('Celular (WhatsApp)').fill('44999990000');
    await page.getByLabel('Senha').fill('Demo12345');
    await page.getByRole('checkbox', { name: /Termos de Uso/ }).check();
    await page.getByRole('button', { name: 'Criar conta e continuar' }).click();

    // Painel: cadastro novo, loja oculta até a aprovação
    await expect(page).toHaveURL(/\/painel\/cadastro$/);
    await expect(page.getByText('Cadastro incompleto').first()).toBeVisible();
    await expect(page.getByLabel('Nome fantasia (aparece na vitrine)')).toHaveValue('Moda Exemplo');

    // 1. Empresa
    await page.getByLabel('Razão social').fill('Moda Exemplo Ltda');
    await continuar(page);
    // 2. Responsável (nome, e-mail e celular já vieram da adesão)
    await continuar(page);
    await expect(page.getByText('CPF inválido.')).toBeVisible();
    await page.getByLabel('CPF').fill('52998224725');
    await continuar(page);
    // 3. Unidade
    await page.getByLabel('Rua').fill('Av. América');
    await page.getByLabel('Número').fill('100');
    await page.getByLabel('Bairro').fill('Zona 1');
    await continuar(page);
    // 4. Recebimento
    await page.getByRole('button', { name: 'Conectar conta de recebimento' }).click();
    await expect(page.getByText('Conta conectada')).toBeVisible();
    await continuar(page);
    // 5. Documentos
    await page.getByLabel('Anexar Cartão CNPJ').setInputFiles(documento);
    await expect(page.getByText('cartao-cnpj.pdf')).toBeVisible();
    await continuar(page);

    // O rascunho sobrevive a recarregar a página
    await page.reload();
    await expect(page.getByRole('heading', { name: '6. Revisão' })).toBeVisible();
    await expect(page.getByText('Moda Exemplo · CNPJ 11.222.333/0001-81')).toBeVisible();

    await page.getByRole('checkbox', { name: /Contrato do Lojista/ }).check();
    await page.getByRole('button', { name: 'Enviar para análise' }).click();
    await aviso(page, 'Cadastro enviado!');
    await expect(page.getByText('Cadastro em análise.')).toBeVisible();

    await page.getByRole('button', { name: 'Simular aprovação' }).click();
    await expect(page.getByText('Loja aprovada.')).toBeVisible();
    await expect(page.getByRole('complementary')).toContainText('Moda Exemplo');
  });
});

test.describe('Letreiro de ofertas (vaga T1)', () => {
  test('aparece na barra do topo com "Patrocinado" e pode ser pausado', async ({ page }) => {
    await primeiraVisita(page);
    const letreiro = page.getByRole('region', { name: 'Ofertas e avisos da cidade' });
    await expect(letreiro).toContainText('Patrocinado · Confecções Vale Azul');
    await expect(letreiro).toContainText('Entrega no mesmo dia em Cianorte');
    await page.getByRole('button', { name: 'Pausar o letreiro' }).click();
    await expect(page.getByRole('button', { name: 'Continuar o letreiro' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // A barra de categorias não repete mais os atalhos da home
    await expect(page.getByRole('button', { name: 'Mais', exact: true })).toHaveCount(0);
  });

  test('atalhos de categoria ficam numa fileira só, em carrossel', async ({ page }) => {
    await primeiraVisita(page);
    const atalhos = page.getByRole('region', { name: 'Categorias' }).getByRole('listitem');
    const topos = await atalhos.evaluateAll((els) => [
      ...new Set(els.map((e) => Math.round(e.getBoundingClientRect().top))),
    ]);
    expect(topos).toHaveLength(1);
  });

  test('lojista contrata o letreiro, envia a frase e o admin aprova', async ({ page }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'ct-sessao-lojista-v1',
        JSON.stringify({ state: { lojista: { email: 'loja@exemplo.com' } }, version: 0 }),
      ),
    );
    await page.goto('/painel/anuncios?vaga=T1');
    await expect(page.getByRole('heading', { name: 'Letreiro de ofertas' })).toBeVisible();
    await page.getByRole('button', { name: /^Contratar por/ }).click();
    await page.getByRole('row', { name: /T1/ }).getByRole('link', { name: 'Enviar arte' }).click();
    await expect(page.getByRole('heading', { name: 'Enviar frase do letreiro' })).toBeVisible();
    await page.getByLabel('Frase').fill('Camisaria com 20% off só nesta semana');
    await expect(page.getByRole('region', { name: 'Simulação da vaga' })).toContainText(
      'Camisaria com 20% off só nesta semana',
    );
    await page.getByRole('button', { name: 'Enviar para aprovação' }).click();
    await aviso(page, 'Frase enviada para aprovação.');

    await page.goto('/admin/moderacao');
    await page.getByRole('button', { name: 'Aprovar frase' }).click();
    await page.goto('/painel/anuncios');
    await expect(page.getByRole('row', { name: /T1/ }).first()).toContainText('No ar');
  });
});

test('painel com dados antigos no aparelho (sem a vaga T1) não quebra os anúncios', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ct-sessao-lojista-v1',
      JSON.stringify({ state: { lojista: { email: 'loja@exemplo.com' } }, version: 0 }),
    );
    if (localStorage.getItem('ct-painel-v1')) return;
    const vagas = ['H1', 'M1', 'M2', 'C1', 'K1', 'L1'].map((id) => ({
      id,
      modoCompra: id === 'H1' ? 'lance' : 'direta',
      nome: `Vaga ${id}`,
      pagina: id === 'K1' || id === 'L1' ? 'categoria' : 'home',
      posicao: '',
      formato: { desktop: '1200 × 400 px', mobile: '800 × 600 px', proporcao: '' },
      precoDiaCentavos: 5000,
      rotacao: 2,
      status: 'disponivel',
      lanceAtualCentavos: null,
      lances: 0,
      terminaEm: null,
      ocupadoAte: null,
    }));
    localStorage.setItem(
      'ct-painel-v1',
      JSON.stringify({ state: { vagas, vagaSelecionada: 'T1', campanhas: [] }, version: 3 }),
    );
  });
  const erros: string[] = [];
  page.on('pageerror', (e) => erros.push(e.message));
  await page.goto('/painel/anuncios');
  await expect(page.getByRole('button', { name: /^T1 · / })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Anúncios' })).toBeVisible();
  expect(erros).toEqual([]);
});
