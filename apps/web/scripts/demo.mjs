/**
 * Sobe a DEMONSTRAÇÃO rápida: gera a versão de produção (páginas já compiladas) e abre
 * em modo demo. O `npm run dev` compila cada página na primeira visita (lento no Windows);
 * para apresentar, use sempre `npm run demo`.
 *
 * Uso: npm run demo            → http://cianorte.localhost:3000
 *      npm run demo -- 3100    → outra porta
 * Cada porta usa uma pasta de build própria, sem disputar arquivos com outro servidor.
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const porta = process.argv[2] ?? '3000';
const env = {
  ...process.env,
  NEXT_DIST_DIR: `.next-demo-${porta}`,
  NEXT_PUBLIC_DEMO_MODE: 'true',
  DEFAULT_TENANT: process.env.DEFAULT_TENANT ?? 'cianorte',
  NEXT_TELEMETRY_DISABLED: '1',
};
const rodar = (args) =>
  new Promise((ok, falha) => {
    const p = spawn('npx', ['next', ...args], { cwd: raiz, env, stdio: 'inherit', shell: true });
    p.on('exit', (c) => (c === 0 ? ok() : falha(new Error(`next ${args[0]} saiu com ${c}`))));
  });

console.log('\n▶ Gerando a versão de produção (leva ~1 minuto)…\n');
await rodar(['build']);
console.log(`\n✔ Pronto. Abra http://cianorte.localhost:${porta}  (Ctrl+C para parar)\n`);
await rodar(['start', '-p', porta]);
