/* Service worker mínimo: cache do "casco" do app para abrir offline.
   Em produção: estratégia por rota (rede primeiro para preços/estoque). */
const CACHE = 'ct-shell-v1';
const SHELL = ['./', './index.html', './css/styles.css', './js/data.js', './js/app.js', './manifest.webmanifest', './icons/icon.svg'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
