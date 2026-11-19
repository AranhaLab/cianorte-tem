import { defineConfig, devices } from '@playwright/test';

/**
 * Jornadas de ponta a ponta em 390 px (celular) e 1440 px (desktop).
 * Roda contra o build de produção em modo demo. *.localhost resolve para
 * 127.0.0.1 no Chromium, então cada cidade é testada pelo seu subdomínio.
 */
const PORTA = 3200;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // os testes compartilham o servidor; sequencial evita disputa de compilação
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://cianorte.localhost:${PORTA}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'celular-390',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    { name: 'desktop-1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORTA}`,
    url: `http://127.0.0.1:${PORTA}/manifest.webmanifest`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { NEXT_PUBLIC_DEMO_MODE: 'true', DEFAULT_TENANT: 'cianorte', NEXT_TELEMETRY_DISABLED: '1' },
  },
});
