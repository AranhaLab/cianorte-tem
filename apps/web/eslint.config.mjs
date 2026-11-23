import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

export default [
  { ignores: ['.next/**', '.next-*/**', 'playwright-report/**', 'test-results/**', 'node_modules/**', 'next-env.d.ts', 'public/sw.js'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  {
    rules: {
      // Parâmetros com "_" são intencionais (ex.: tenant nos mocks, usado quando a API real entrar).
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Regra do projeto: nenhuma cor fora dos tokens do tailwind.config.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message: 'Use os tokens do tailwind.config (ex.: bg-marinho). Cores de dados vêm da API.',
        },
      ],
    },
  },
  {
    // Mocks e tokens são os únicos lugares onde hex é permitido.
    // Manifest e ícones: o formato exige hex (espelham os tokens marinho/linho/branco).
    files: [
      'src/mocks/**',
      'tailwind.config.ts',
      'src/lib/tenant/**',
      'src/app/icons/**',
      'src/app/manifest.webmanifest/**',
      '**/*.test.ts',
    ],
    rules: { 'no-restricted-syntax': 'off' },
  },
];
