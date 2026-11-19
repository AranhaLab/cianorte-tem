import { expect, type Page } from '@playwright/test';

/** Primeira visita: responde o modal de localização e o banner de cookies. */
export async function primeiraVisita(page: Page, cep = '87200000') {
  await page.goto('/');
  const modal = page.getByRole('dialog', { name: 'Onde você quer receber?' });
  await expect(modal).toBeVisible();
  await modal.getByLabel('CEP da sua rua').fill(cep);
  await modal.getByRole('button', { name: 'Confirmar localização' }).click();
  await expect(modal).toBeHidden();
  await page.getByRole('button', { name: 'Só necessários' }).click();
}

/** Aviso flutuante (toast) com o texto esperado. */
export const aviso = (page: Page, texto: string | RegExp) =>
  expect(page.getByRole('status').filter({ hasText: texto }).first()).toBeVisible();
