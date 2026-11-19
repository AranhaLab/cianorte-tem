/* Service worker do <Cidade> Tem (PWA).
 *
 * Estratégias:
 * - Arquivos estáticos versionados do Next (/_next/static), ícones e fontes: cache primeiro.
 * - Páginas públicas (vitrine, categoria, produto, loja): REDE PRIMEIRO, cópia em cache
 *   só para abrir offline. Preço e estoque nunca saem do cache se houver rede.
 * - Áreas pessoais (conta, checkout, pedido, painel, admin, sacola): nunca vão para o cache.
 * - Sem rede e sem cópia: página /offline.
 * - Requisições que não são GET ou de outra origem: o navegador cuida, sem interferência.
 */
const VERSAO = 'ct-v2'; // v2: /admin entrou na lista de áreas privadas
const ESTATICO = `${VERSAO}-estatico`;
const PAGINAS = `${VERSAO}-paginas`;
const OFFLINE = '/offline';
const PRIVADO = /^\/(conta|checkout|pedido|painel|admin|sacola|entrar|cadastro)(\/|$)/;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(PAGINAS)
      .then((c) => c.add(new Request(OFFLINE, { cache: 'reload' })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => !k.startsWith(VERSAO)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/_next/static/media/')) {
    e.respondWith(
      caches.open(ESTATICO).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  if (req.mode === 'navigate') {
    const privado = PRIVADO.test(url.pathname);
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && !privado) caches.open(PAGINAS).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(async () => (!privado && (await caches.match(req))) || (await caches.match(OFFLINE)) || Response.error()),
    );
  }
});
