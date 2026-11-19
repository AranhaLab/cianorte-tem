import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Testes de unidade das regras de negócio (src/lib/**). Jornadas ficam no Playwright (e2e/). */
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
