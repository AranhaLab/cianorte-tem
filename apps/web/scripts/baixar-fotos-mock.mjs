/**
 * Baixa as fotos ilustrativas dos produtos da demonstração (Unsplash, licença livre)
 * para public/produtos/<produto>-<n>.webp e as dos anúncios para public/anuncios/. Moda em 4:5 e o resto em 1:1 (CLAUDE.md §3).
 * Uso: node scripts/baixar-fotos-mock.mjs   (só baixa o que ainda não existe)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const fotos = JSON.parse(readFileSync(join(raiz, 'src/mocks/fotos-mock.json'), 'utf8'));
const MODA = new Set(['p1', 'p2', 'p3', 'p5', 'p29', 'p34', 'p27', 'p28', 'p30', 'p31', 'p32']);
const destino = join(raiz, 'public/produtos');
mkdirSync(destino, { recursive: true });

let baixadas = 0;
let bytes = 0;
for (const [produto, ids] of Object.entries(fotos)) {
  if (produto.startsWith('_') || produto === 'anuncios') continue;
  const [w, h] = MODA.has(produto) ? [800, 1000] : [800, 800];
  for (const [i, id] of ids.entries()) {
    const arquivo = join(destino, `${produto}-${i + 1}.webp`);
    if (existsSync(arquivo)) continue;
    const url = `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&fm=webp&q=72`;
    const r = await fetch(url);
    if (!r.ok) {
      console.error(`ERRO ${r.status} ${produto} ${id}`);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    writeFileSync(arquivo, buf);
    baixadas++;
    bytes += buf.length;
  }
}
// Criativos dos anúncios: public/anuncios/<vaga>-<tema>.webp, no tamanho da vaga (CLAUDE.md §9.1).
const destinoAnuncios = join(raiz, 'public/anuncios');
mkdirSync(destinoAnuncios, { recursive: true });
for (const [nome, [id, w, h]] of Object.entries(fotos.anuncios ?? {})) {
  const arquivo = join(destinoAnuncios, `${nome}.webp`);
  if (existsSync(arquivo)) continue;
  const r = await fetch(`https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&crop=entropy&fm=webp&q=72`);
  if (!r.ok) {
    console.error(`ERRO ${r.status} ${nome} ${id}`);
    continue;
  }
  const buf = Buffer.from(await r.arrayBuffer());
  writeFileSync(arquivo, buf);
  baixadas++;
  bytes += buf.length;
}
console.log(`${baixadas} fotos baixadas, ${(bytes / 1e6).toFixed(1)} MB`);
