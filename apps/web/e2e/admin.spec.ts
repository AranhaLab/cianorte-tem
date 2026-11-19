import { expect, test, type Page } from '@playwright/test';
import { aviso, entrarComoLojista } from './ajuda';

/** Abre "Reprovar"/"Suspender"… dentro de `onde`, preenche o motivo e confirma. */
async function comMotivo(
  page: Page,
  onde: ReturnType<Page['locator']>,
  botao: string,
  confirmar: string,
  motivo: string,
) {
  await onde.getByRole('button', { name: botao, exact: true }).click();
  await onde.getByLabel(/Motivo/).fill(motivo);
  await onde.getByRole('button', { name: confirmar }).click();
}

test.beforeEach(({ page }) => entrarComoLojista(page));

test.describe('Administração da plataforma (etapa 10)', () => {
  test('moderação: reprovar exige motivo, o lojista vê e a auditoria registra', async ({ page }) => {
    // Lojista muda o nome (vai para a moderação)
    await page.goto('/painel/produtos/p1');
    await page.getByLabel('Nome do produto').fill('Camisa slim — PROMOÇÃO IMPERDÍVEL');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await aviso(page, 'Alteração enviada para moderação.');

    await page.goto('/admin/moderacao');
    const card = page.getByRole('article', { name: 'Moderação: Camisa social slim fit algodão' });
    await expect(card).toContainText('Mudou: nome');
    await expect(card).toContainText('Nome proposto: Camisa slim — PROMOÇÃO IMPERDÍVEL');
    await card.getByRole('button', { name: 'Reprovar', exact: true }).click();
    await card.getByLabel(/Motivo/).fill('curto');
    await card.getByRole('button', { name: 'Confirmar reprovação' }).click();
    await expect(card.getByText('Escreva pelo menos 10 caracteres.')).toBeVisible();
    await card.getByLabel(/Motivo/).fill('Nome com texto promocional; use só o nome do produto.');
    await card.getByRole('button', { name: 'Confirmar reprovação' }).click();
    await aviso(page, 'Reprovado. A versão publicada continua no ar.');
    await expect(card).toHaveCount(0);

    await page.goto('/painel/produtos');
    await expect(page.getByRole('row', { name: /Camisa social slim fit algodão/ })).toContainText(
      'Reprovado',
    );
    await page.goto('/painel/produtos/p1');
    await expect(page.locator('main').getByRole('alert')).toContainText('Nome com texto promocional');

    await page.goto('/admin/auditoria');
    await expect(page.getByRole('row', { name: /Reprovou alteração de produto/ })).toContainText(
      'Nome com texto promocional',
    );
  });

  test('cadastros: sem cartão CNPJ não aprova; aprovado sai da fila', async ({ page }) => {
    await page.goto('/admin/lojas');
    const eletro = page.getByRole('article', { name: 'Cadastro de Eletro Center Cianorte' });
    await expect(eletro.getByRole('button', { name: 'Aprovar' })).toBeDisabled();
    await expect(eletro).toContainText('Falta o cartão CNPJ');

    const sapataria = page.getByRole('article', { name: 'Cadastro de Sapataria Passo Firme' });
    await sapataria.getByRole('button', { name: 'Aprovar' }).click();
    await aviso(page, 'Sapataria Passo Firme aprovada.');
    await expect(sapataria).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Decididos' })).toContainText('Sapataria Passo Firme');
  });

  test('pedido em análise bloqueia o avanço no painel da loja', async ({ page }) => {
    await page.goto('/admin/pedidos');
    const sp = page.getByRole('article', { name: 'Subpedido 10482-A' });
    await comMotivo(
      page,
      sp,
      'Colocar em análise',
      'Confirmar análise',
      'Endereço divergente do cadastro do cartão.',
    );
    await expect(sp).toContainText('Em análise administrativa');

    await page.goto('/painel/pedidos');
    const linha = page.getByRole('row', { name: /10482-A/ });
    await expect(linha).toContainText('Em análise pela plataforma');
    await expect(linha.getByRole('button')).toHaveCount(0);

    await page.goto('/admin/pedidos?f=analise');
    await comMotivo(
      page,
      page.getByRole('article', { name: 'Subpedido 10482-A' }),
      'Liberar',
      'Confirmar liberação',
      'Comprador confirmou o endereço por telefone.',
    );
    await page.goto('/painel/pedidos');
    await expect(
      page.getByRole('row', { name: /10482-A/ }).getByRole('button', { name: 'Em separação' }),
    ).toBeVisible();
  });

  test('comissão mudada no admin aparece no financeiro do lojista', async ({ page }) => {
    await page.goto('/admin/regras');
    await page.getByLabel('Comissão (%)').fill('12');
    await comMotivo(
      page,
      page.getByRole('region', { name: 'Comissão' }),
      'Aplicar 12%',
      'Confirmar nova comissão',
      'Ajuste aprovado pelo PO para o piloto.',
    );
    await aviso(page, 'Comissão agora é 12%.');
    await page.goto('/painel/financeiro');
    await expect(page.getByText(/comissão 12% sobre produtos/)).toBeVisible();
  });

  test('suspender a loja a tira do ar; filial aprovada no admin', async ({ page }) => {
    await page.goto('/painel/loja');
    await page.getByRole('button', { name: 'Adicionar filial' }).click();
    const form = page.getByRole('form', { name: 'Nova unidade' });
    await form.getByLabel('Nome da unidade').fill('Vale Azul Shopping');
    await form.getByLabel('CEP').fill('87200-100');
    await form.getByLabel('Endereço (rua e número)').fill('Av. Brasil, 1000');
    await form.getByLabel('Bairro').fill('Zona 1');
    await form.getByRole('button', { name: 'Enviar para análise' }).click();

    await page.goto('/admin/lojas?aba=filiais');
    await page
      .getByRole('article', { name: 'Filial Vale Azul Shopping' })
      .getByRole('button', { name: 'Aprovar' })
      .click();
    await aviso(page, 'Vale Azul Shopping aprovada.');

    await page.getByRole('button', { name: 'Lojas', exact: true }).click();
    const loja = page.getByRole('article', { name: 'Confecções Vale Azul' });
    await comMotivo(
      page,
      loja,
      'Suspender loja',
      'Confirmar suspensão',
      'Documentação vencida, aguardando renovação.',
    );
    await expect(loja).toContainText('Suspensa');

    await page.goto('/painel/loja');
    await expect(page.getByRole('region', { name: 'Unidades' })).toContainText('Aprovada');
    await expect(page.getByRole('switch', { name: 'Loja visível no marketplace' }).first()).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  test('selo Loja oficial exige os três documentos', async ({ page }) => {
    await page.goto('/admin/lojas?aba=lojas');
    await expect(
      page.getByRole('article', { name: 'Pet Amigo' }).getByRole('button', { name: 'Conceder Loja oficial' }),
    ).toBeDisabled();
    const lar = page.getByRole('article', { name: 'Lar Bordado' });
    await lar.getByRole('button', { name: 'Conceder Loja oficial' }).click();
    await expect(lar).toContainText('Loja oficial');
    await expect(lar.getByRole('button', { name: 'Revogar Loja oficial' })).toBeVisible();
  });
});
