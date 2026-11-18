/* =========================================================================
   Cianorte Tem — protótipo front-end (SPA sem build, rotas por hash)
   Três frentes: comprador (web + PWA), painel do lojista e central de anúncios.
   Estado local em localStorage só para demonstração. Regras: ver CLAUDE.md.
   ========================================================================= */
(function () {
  'use strict';
  var CITY = window.CITY, CATS = window.CATEGORIES, STORES = window.STORES, PRODUCTS = window.PRODUCTS;
  var SLOTS = window.AD_SLOTS, ADS = window.ADS, ICON = window.ICON, OST = window.ORDER_STATUS;

  /* ---------------- Estado ---------------- */
  var KEY = 'ct_state_v2';
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function fresh() {
    return {
      cart: [], favs: [], user: null, cep: CITY.cepPadrao, cookies: null, orders: [],
      seller: clone(window.SELLER_DEMO), bookings: [], checkout: { step: 'entrega', modos: {}, pagamento: 'pix' },
      adSel: 'H1', adUnit: 'dias', adQty: 7, sellerTab: 'venda', homeSlide: 0, cepOk: false
    };
  }
  var S = fresh();
  try { var raw = window.localStorage && localStorage.getItem(KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* storage indisponível: segue em memória */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

  /* ---------------- Helpers ---------------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ic(name, cls) { return '<svg class="ico ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + (ICON[name] || '') + '"/></svg>'; }
  function money(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function prod(id) { return PRODUCTS.find(function (p) { return p.id === id; }); }
  function store(id) { return STORES.find(function (s) { return s.id === id; }); }
  function cat(id) { return CATS.find(function (c) { return c.id === id; }); }
  function slot(id) { return SLOTS.find(function (s) { return s.id === id; }); }
  function initials(n) { return n.split(' ').filter(function (w) { return w.length > 2; }).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); }
  function offPct(p) { return p.de ? Math.round((1 - p.preco / p.de) * 100) : 0; }
  function cartCount() { return S.cart.reduce(function (a, i) { return a + i.qty; }, 0); }
  function cepPrefix() { return (S.cep || '').replace(/\D/g, '').slice(0, 5); }
  function cepNaCidade() { return CITY.cepsAtendidos.indexOf(cepPrefix()) >= 0; }
  function freteLoja(st) { return Math.max(6, +(st.tarifaKm * 3.4).toFixed(2)); } // distância demo 3,4 km (rota real virá do back-end)
  function subLoja(stId) { return S.cart.reduce(function (a, i) { var p = prod(i.id); return p && p.loja === stId ? a + p.preco * i.qty : a; }, 0); }
  function freteFinal(st) { return st.freteGratis && subLoja(st.id) >= st.freteGratis ? 0 : freteLoja(st); }
  function freteGratisInfo(st) {
    if (!st.freteGratis) return '';
    var falta = st.freteGratis - subLoja(st.id), pct = Math.min(100, Math.round(subLoja(st.id) / st.freteGratis * 100));
    return '<div class="fg"><span class="small">' + (falta <= 0 ? ic('check', 'ico-sm') + '<b>Frete grátis nesta loja</b>' : 'Faltam <b>' + money(falta) + '</b> para frete grátis nesta loja') + '</span><span class="bar" style="width:100%"><i style="width:' + pct + '%"></i></span></div>';
  }
  var DISP = { ok: ['Disponível', 'st-green'], pouco: ['Últimas unidades', 'st-amber'], esgotado: ['Indisponível', 'st-gray'] };
  function art(p, cls, big) {
    var c = cat(p.cat);
    return '<div class="' + (cls || 'media') + (p.cat === 'moda' ? ' r45' : '') + '" style="background:' + c.tint + '">' +
      '<svg class="art" viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICON[c.icon] + '"/></svg>' + (big || '') + '</div>';
  }
  function seloPill(st) {
    if (!st || !st.selo) return '';
    return st.selo === 'oficial' ? '<span class="pill pill-oficial">' + ic('shield', 'ico-sm') + 'Loja oficial</span>' : '<span class="pill pill-indicada">' + ic('medal', 'ico-sm') + 'Indicada</span>';
  }

  /* ---------------- Componentes de vitrine ---------------- */
  function pcard(p, opt) {
    opt = opt || {};
    var st = store(p.loja), off = offPct(p), fav = S.favs.indexOf(p.id) >= 0;
    var flags = (off ? '<span class="pill pill-sale">−' + off + '%</span>' : '') + (p.kit ? '<span class="pill pill-indicada">Kit</span>' : '') + (p.disp === 'esgotado' ? '<span class="pill pill-off">Indisponível</span>' : '');
    return '<div class="pcard' + (p.disp === 'esgotado' ? ' sold' : '') + '">' +
      '<a href="#/p/' + p.id + '" style="color:inherit;display:flex;flex-direction:column;gap:8px;flex:1" aria-label="' + esc(p.nome) + '">' +
      art(p, 'media', '<div class="flags">' + flags + '</div>' + (opt.sponsored ? '<span class="pill pill-ad ad-flag">Patrocinado</span>' : '')) +
      '<div class="body">' +
      '<span class="name">' + esc(p.nome) + '</span>' +
      (p.de ? '<span class="old">' + money(p.de) + '</span>' : '<span class="old" style="visibility:hidden">.</span>') +
      '<span class="price">' + money(p.preco) + (off ? '<span class="off">' + off + '% OFF</span>' : '') + '</span>' +
      '<span class="ship">' + (st.prazo.indexOf('Hoje') === 0 || st.prazo.indexOf('Em 2') === 0 ? 'Chega hoje' : 'Chega ' + st.prazo.toLowerCase()) + '</span>' +
      '<span class="store">' + ic('store', 'ico-sm') + esc(st.nome) + '</span>' +
      '</div></a>' +
      (p.disp !== 'esgotado' ? '<button class="qadd" data-act="qadd" data-id="' + p.id + '" aria-label="Adicionar ' + esc(p.nome) + ' à sacola">' + ic('plus') + '</button>' : '') +
      '<button class="fav" data-act="fav" data-id="' + p.id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'Remover dos favoritos' : 'Favoritar') + '">' + '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="' + (fav ? 'fill:#D7263D;stroke:#D7263D' : '') + '"><path d="' + ICON.heart + '"/></svg></button>' +
      '</div>';
  }
  function rail(id, title, items, opt) {
    opt = opt || {};
    return '<section class="section" aria-labelledby="h-' + id + '">' +
      '<div class="section-head"><div class="stack" style="--gap:2px">' + (opt.kicker ? '<span class="kicker">' + opt.kicker + '</span>' : '') + '<h2 id="h-' + id + '">' + (opt.icon ? ic(opt.icon) : '') + title + '</h2></div>' + (opt.more ? '<a class="small" href="' + opt.more + '" style="font-weight:600">Ver todos</a>' : '') + '</div>' +
      '<div class="rail-wrap"><button class="rail-arrow l" data-act="rail" data-dir="-1" data-target="r-' + id + '" aria-label="Anterior">' + ic('chevL') + '</button>' +
      '<div class="rail" id="r-' + id + '">' + items.map(function (p, i) { return pcard(p, { sponsored: opt.sponsorFirst && i === 0 }); }).join('') + '</div>' +
      '<button class="rail-arrow r" data-act="rail" data-dir="1" data-target="r-' + id + '" aria-label="Próximo">' + ic('chevR') + '</button></div></section>';
  }
  function adStrip(a, slotId) {
    return '<a class="ad ad-strip stitch" href="' + a.link + '" style="background:' + a.bg + ';color:' + a.fg + ';--r-lg:24px" aria-label="Anúncio: ' + esc(a.titulo) + '">' +
      '<span class="pill pill-ad ad-label">Patrocinado · ' + esc(a.loja) + '</span>' +
      '<div class="stack" style="--gap:4px;max-width:640px"><h3>' + esc(a.titulo) + '</h3><span style="opacity:.85">' + esc(a.sub) + '</span></div>' +
      '<span class="btn btn-dark">' + esc(a.cta) + ic('chevR', 'ico-sm') + '</span></a>';
  }
  function storeCard(st) {
    return '<a class="store-card" href="#/loja/' + st.id + '"><span class="store-logo" style="background:' + st.cor + '">' + initials(st.nome) + '</span>' +
      '<span class="stack grow" style="--gap:3px"><b style="font-size:14px;color:#14213D">' + esc(st.nome) + '</b>' +
      '<span class="xs muted row" style="--gap:4px">' + ic('star', 'ico-sm') + st.nota.toFixed(1) + ' · ' + esc(st.bairro) + ' · ' + esc(cat(st.cat).nome) + '</span>' +
      '<span class="row wrap" style="--gap:4px"><span class="pill pill-local">' + ic('pin', 'ico-sm') + 'Loja de ' + CITY.nome + '</span>' + seloPill(st) + '</span></span></a>';
  }

  /* ---------------- Layout do comprador ---------------- */
  function shopLayout(content, active, extraClass) {
    var cc = cartCount();
    var top =
      '<div class="utilbar"><div class="container row between"><span class="row" style="--gap:6px">' + ic('pin', 'ico-sm') + 'O comércio de ' + CITY.nome + ', perto de você · parceria ' + CITY.associacao + '</span><span class="row" style="--gap:16px"><a href="#/vender">Seu comércio também tem lugar aqui — <b>Quero vender</b></a><a href="#/painel">Painel do lojista →</a></span></div></div>' +
      '<header class="topbar"><div class="topbar-inner">' +
      '<a class="brand" href="#/" aria-label="' + CITY.marca + ' — início">' + CITY.nome + '<span class="tag">Tem</span></a>' +
      '<button class="cep-btn" data-act="cep">' + ic('pin', 'ico-sm') + '<span>Entregar em <b>' + esc(S.cep) + '</b></span>' + ic('chevD', 'ico-sm') + '</button>' +
      '<form class="search" role="search" data-form="search"><label for="q" class="sr">Buscar</label>' + ic('search') + '<input id="q" name="q" placeholder="O que você procura em ' + CITY.nome + '?" autocomplete="off"><button class="btn btn-primary" type="submit">Buscar</button></form>' +
      '<div class="top-actions">' +
      '<a class="top-link" href="#/vender">Venda no ' + CITY.marca + '</a>' +
      '<a class="top-link" href="' + (S.user ? '#/conta' : '#/entrar') + '">' + (S.user ? 'Olá, ' + esc(S.user.nome.split(' ')[0]) : 'Entrar') + '</a>' +
      '<a class="icon-btn" href="#/conta/favoritos" aria-label="Favoritos">' + ic('heart') + '</a>' +
      '<a class="icon-btn" href="#/sacola" aria-label="Sacola, ' + cc + ' itens">' + ic('bag') + (cc ? '<span class="badge-count">' + cc + '</span>' : '') + '</a>' +
      '</div></div>' +
      '<nav class="catbar" aria-label="Categorias"><div class="catbar-inner"><button class="all chip" style="background:transparent;border:0;color:#fff;min-height:40px" data-act="cats">' + ic('menu', 'ico-sm') + 'Categorias</button>' +
      CATS.map(function (c) { return '<a href="#/c/' + c.id + '" class="' + (active === 'c-' + c.id ? 'on' : '') + '">' + c.nome + '</a>'; }).join('') +
      '<a href="#/lojas">Lojas</a><a href="#/ofertas">Ofertas</a></div></nav></header>';
    var bottom = '<nav class="bottom-nav" aria-label="Navegação principal">' +
      bnItem('#/', 'home', 'Início', active === 'home') + bnItem('#/categorias', 'grid', 'Categorias', active === 'cats' || (active || '').indexOf('c-') === 0) +
      bnItem('#/sacola', 'bag', 'Sacola', active === 'cart', cc) + bnItem(S.user ? '#/conta' : '#/entrar', 'user', S.user ? 'Conta' : 'Entrar', active === 'account') + '</nav>';
    var foot = '<footer class="footer"><div class="container"><div class="footer-grid">' +
      '<div class="stack"><span class="brand">' + CITY.nome + '<span class="tag">Tem</span></span><span>' + CITY.slogan + ' Marketplace regional com lojas de ' + CITY.nome + ' e região, em parceria com a ' + CITY.associacao + '.</span><span class="xs">[Razão social da operadora] · CNPJ [00.000.000/0000-00] · [Endereço]</span></div>' +
      '<div><h4>Comprar</h4><ul><li><a href="#/categorias">Categorias</a></li><li><a href="#/ofertas">Ofertas</a></li><li><a href="#/lojas">Lojas da cidade</a></li><li><a href="#/conta/pedidos">Meus pedidos</a></li></ul></div>' +
      '<div><h4>Vender</h4><ul><li><a href="#/vender">Seja um lojista</a></li><li><a href="#/painel">Painel do lojista</a></li><li><a href="#/painel/anuncios">Anuncie aqui</a></li></ul></div>' +
      '<div><h4>Ajuda e legal</h4><ul><li><a href="#/termos">Termos de uso</a></li><li><a href="#/privacidade">Privacidade (LGPD)</a></li><li><a href="#/termos#trocas">Trocas e arrependimento</a></li><li><a href="#/privacidade#cookies">Cookies</a></li></ul></div>' +
      '</div></div></footer>';
    var cookie = S.cookies ? '' : '<div class="cookie" role="dialog" aria-label="Preferências de cookies"><span>Usamos cookies necessários para a loja funcionar e, com a sua permissão, cookies de medição e de anúncios. <a href="#/privacidade#cookies" style="color:#fff;text-decoration:underline">Saiba mais</a>.</span><div class="row wrap"><button class="btn btn-primary btn-sm" data-act="cookies" data-v="todos">Aceitar todos</button><button class="btn btn-ghost btn-sm" data-act="cookies" data-v="necessarios">Só necessários</button></div></div>';
    return { cls: 'has-bottom-nav ' + (extraClass || ''), html: top + '<main><div class="container">' + content + '</div></main>' + foot + bottom + cookie };
  }
  function bnItem(href, icon, label, on, count) {
    return '<a href="' + href + '" class="' + (on ? 'on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + ic(icon, 'ico-lg') + label + (count ? '<span class="badge-count">' + count + '</span>' : '') + '</a>';
  }

  /* ---------------- Telas do comprador ---------------- */
  function vHome() {
    var byVend = PRODUCTS.filter(function (p) { return p.disp !== 'esgotado'; }).slice().sort(function (a, b) { return b.vendidos - a.vendidos; }).slice(0, 10);
    var ofertas = PRODUCTS.filter(function (p) { return p.de && p.disp !== 'esgotado'; }).sort(function (a, b) { return offPct(b) - offPct(a); }).slice(0, 10);
    var hot = PRODUCTS.slice().sort(function (a, b) { return b.quente - a.quente; }).slice(0, 8);
    var moda = PRODUCTS.filter(function (p) { return p.cat === 'moda' || (p.loja === 'vale-azul'); }).slice(0, 8);
    var slides = ADS.H1.map(function (a, i) {
      return '<a class="hero-slide" id="hs-' + i + '" href="' + a.link + '" style="background:' + a.bg + ';color:' + a.fg + '" aria-label="Anúncio ' + (i + 1) + ' de ' + ADS.H1.length + ': ' + esc(a.titulo) + '">' +
        '<span class="deco" style="background:' + a.acc + '"></span><span class="deco2"></span>' +
        '<span class="pill pill-ad" style="align-self:flex-start">Patrocinado · ' + esc(a.loja) + '</span>' +
        '<h2>' + esc(a.titulo) + '</h2><p>' + esc(a.sub) + '</p><span class="btn" style="align-self:flex-start;background:' + a.fg + ';color:' + a.bg + '">' + esc(a.cta) + ic('chevR', 'ico-sm') + '</span></a>';
    }).join('');
    var c = '' +
      '<div class="hero"><div class="hero-track" id="hero" aria-roledescription="carrossel">' + slides + '</div>' +
      '<div class="hero-dots" aria-hidden="true">' + ADS.H1.map(function (_, i) { return '<span class="' + (i === 0 ? 'on' : '') + '"></span>'; }).join('') + '</div></div>' +
      '<section class="section" aria-label="Categorias"><div class="cat-shortcuts">' +
      CATS.map(function (c) { return '<a class="cat-shortcut" href="#/c/' + c.id + '"><span class="ic">' + ic(c.icon, 'ico-lg') + '</span>' + c.nome + '</a>'; }).join('') + '</div></section>' +
      '<div class="trust">' +
      '<div>' + ic('pin', 'ico-lg') + '<span><b>Só lojas de ' + CITY.nome + '</b>Quem vende é vizinho seu.</span></div>' +
      '<div>' + ic('truck', 'ico-lg') + '<span><b>Entrega no mesmo dia</b>Ou retire na loja sem frete.</span></div>' +
      '<div>' + ic('lock', 'ico-lg') + '<span><b>Pagamento protegido</b>Pix ou cartão, com dados criptografados.</span></div>' +
      '<div>' + ic('refresh', 'ico-lg') + '<span><b>7 dias para desistir</b>Direito de arrependimento garantido.</span></div></div>' +
      rail('vendidos', 'Mais vendidos da cidade', byVend, { kicker: 'Quem compra, recomenda', icon: 'chart', more: '#/ofertas?ord=vendidos' }) +
      adStrip(ADS.M1, 'M1') +
      rail('ofertas', 'Melhores preços', ofertas, { kicker: 'Desconto de verdade', icon: 'tag', more: '#/ofertas', sponsorFirst: true }) +
      '<section class="section stitch" style="background:#14213D;border-radius:24px;padding:22px 18px;--r-lg:24px" aria-labelledby="h-moda">' +
      '<div class="section-head"><div class="stack" style="--gap:2px"><span class="kicker" style="color:#8FB0EA">Capital do Vestuário</span><h2 id="h-moda" style="color:#fff">Direto das confecções de ' + CITY.nome + '</h2></div><a class="small" href="#/c/moda" style="color:#fff;font-weight:600">Ver moda</a></div>' +
      '<div class="rail">' + moda.map(function (p) { return pcard(p); }).join('') + '</div></section>' +
      '<section class="section" aria-labelledby="h-hot"><div class="section-head"><div class="stack" style="--gap:2px"><span class="kicker">Subindo agora</span><h2 id="h-hot">' + ic('fire') + 'Em alta</h2></div></div>' +
      '<div class="grid-products">' + hot.map(function (p, i) { return pcard(p, { sponsored: i === 0 }); }).join('') + '</div></section>' +
      '<div class="ad-duo">' + ADS.M2.map(function (a) { return '<a class="ad stitch" href="' + a.link + '" style="background:' + a.bg + ';color:' + a.fg + ';--r-lg:24px"><span class="pill pill-ad ad-label">Patrocinado</span><span class="small" style="opacity:.8">' + esc(a.loja) + '</span><h3 style="color:inherit;font-size:22px">' + esc(a.titulo) + '</h3><span style="opacity:.85">' + esc(a.sub) + '</span><span style="font-weight:700;margin-top:6px">' + esc(a.cta) + ' →</span></a>'; }).join('') + '</div>' +
      '<section class="section" aria-labelledby="h-lojas"><div class="section-head"><div class="stack" style="--gap:2px"><span class="kicker">Comércio local</span><h2 id="h-lojas">Lojas de ' + CITY.nome + '</h2></div><a class="small" href="#/lojas" style="font-weight:600">Ver todas</a></div>' +
      '<div class="grid-stores">' + STORES.slice(0, 8).map(storeCard).join('') + '</div></section>' +
      '<section class="section card" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between;background:#EEF2FA;border-color:#DCE1EC"><div class="stack" style="--gap:4px"><h2>Tem loja em ' + CITY.nome + '?</h2><span class="muted">Venda online para a cidade toda, com painel simples e apoio da ' + CITY.associacao + '.</span></div><a class="btn btn-primary btn-lg" href="#/vender">Quero vender</a></section>';
    return shopLayout(c, 'home');
  }

  function vCategorias() {
    var c = '<div class="page-head" style="margin-top:18px"><h1>Categorias</h1></div><div class="mega" style="margin-top:14px">' +
      CATS.map(function (c) { return '<a href="#/c/' + c.id + '"><span class="ic">' + ic(c.icon) + '</span><span class="stack" style="--gap:0">' + c.nome + '<span class="xs muted" style="font-weight:400">' + PRODUCTS.filter(function (p) { return p.cat === c.id; }).length + ' produtos</span></span></a>'; }).join('') + '</div>' +
      '<div class="section"><a class="btn btn-ghost btn-block" href="#/lojas">' + ic('store') + 'Ver todas as lojas</a></div>';
    return shopLayout(c, 'cats');
  }

  function sortList(list, ord) {
    var l = list.slice();
    if (ord === 'menor') l.sort(function (a, b) { return a.preco - b.preco; });
    else if (ord === 'desconto') l.sort(function (a, b) { return offPct(b) - offPct(a); });
    else l.sort(function (a, b) { return b.vendidos - a.vendidos; });
    return l;
  }
  function filterBar(base, q) {
    var ord = q.ord || 'vendidos', f = q.f || '';
    function chip(label, params, on) { return '<a class="chip ' + (on ? 'on' : '') + '" href="' + base + '?' + params + '">' + label + '</a>'; }
    return '<div class="filters" role="toolbar" aria-label="Ordenar e filtrar">' +
      chip('Mais vendidos', 'ord=vendidos' + (f ? '&f=' + f : ''), ord === 'vendidos') +
      chip('Menor preço', 'ord=menor' + (f ? '&f=' + f : ''), ord === 'menor') +
      chip('Maior desconto', 'ord=desconto' + (f ? '&f=' + f : ''), ord === 'desconto') +
      chip(ic('truck', 'ico-sm') + 'Chega hoje', 'ord=' + ord + (f === 'hoje' ? '' : '&f=hoje'), f === 'hoje') +
      chip(ic('store', 'ico-sm') + 'Retirada na loja', 'ord=' + ord + (f === 'retirada' ? '' : '&f=retirada'), f === 'retirada') +
      chip(ic('shield', 'ico-sm') + 'Lojas oficiais', 'ord=' + ord + (f === 'oficial' ? '' : '&f=oficial'), f === 'oficial') + '</div>';
  }
  function applyF(list, f) {
    if (f === 'hoje') return list.filter(function (p) { var s = store(p.loja); return /Hoje|Em 2/.test(s.prazo); });
    if (f === 'retirada') return list.filter(function (p) { return store(p.loja).retirada; });
    if (f === 'oficial') return list.filter(function (p) { return store(p.loja).selo === 'oficial'; });
    return list;
  }
  function vCategoria(id, q) {
    var c = cat(id); if (!c) return vNotFound();
    var all = PRODUCTS.filter(function (p) { return p.cat === id; });
    var list = sortList(applyF(all, q.f), q.ord);
    var cheap = all.slice().sort(function (a, b) { return a.preco - b.preco; });
    var k1 = ADS.K1, l1 = ADS.L1;
    var grid = list.map(function (p, i) {
      var card = pcard(p);
      if (i === 5) card += '<a class="ad stitch" href="' + l1.link + '" style="grid-column:1/-1;background:' + l1.bg + ';color:' + l1.fg + ';padding:20px;flex-direction:column;gap:4px;--r-lg:24px" data-mobile-ad><span class="pill pill-ad ad-label">Patrocinado</span><h3 style="color:inherit">' + esc(l1.titulo) + '</h3><span style="opacity:.85">' + esc(l1.sub) + '</span></a>';
      return card;
    }).join('');
    var content = '<nav class="crumbs" aria-label="Você está em"><a href="#/">Início</a>' + ic('chevR', 'ico-sm') + '<a href="#/categorias">Categorias</a>' + ic('chevR', 'ico-sm') + '<span>' + c.nome + '</span></nav>' +
      '<div class="cat-hero stitch" style="background:' + c.tint + ';--r-lg:24px"><span class="ic" style="width:64px;height:64px;border-radius:20px;background:#fff;display:flex;align-items:center;justify-content:center;color:#14213D;flex:none">' + ic(c.icon, 'ico-lg') + '</span><div class="stack" style="--gap:4px"><h1>' + c.nome + '</h1><span class="muted">' + c.destaque + ' · ' + all.length + ' produtos de lojas de ' + CITY.nome + '</span></div></div>' +
      '<a class="ad ad-strip" href="#/painel/anuncios?slot=K1" style="background:' + k1.bg + ';color:' + k1.fg + ';margin-top:12px;border:1.5px dashed #B9C6E4"><span class="pill pill-ad ad-label">Espaço publicitário</span><div class="stack" style="--gap:2px"><b>Anuncie no topo de ' + c.nome + '</b><span class="small muted">Vaga K1 disponível — veja formatos e valores</span></div><span class="btn btn-soft btn-sm">Ver vaga</span></a>' +
      (all.length > 3 ? rail('cv-' + id, 'Mais vendidos em ' + c.nome.toLowerCase(), all.slice().sort(function (a, b) { return b.vendidos - a.vendidos; }), { icon: 'chart' }) + rail('cb-' + id, 'Melhores preços', cheap, { icon: 'tag', sponsorFirst: true }) : '') +
      '<div class="layout-side section"><div class="stack" style="--gap:14px"><div class="row between wrap"><h2>Todos os produtos</h2><span class="small muted">' + list.length + ' resultados</span></div>' + filterBar('#/c/' + id, q) +
      (list.length ? '<div class="grid-products">' + grid + '</div>' : emptyBox('filter', 'Nenhum produto com esse filtro', 'Tente remover algum filtro.')) + '</div>' +
      '<aside class="side-col" aria-label="Publicidade"><a class="ad ad-side stitch" href="' + l1.link + '" style="background:' + l1.bg + ';color:' + l1.fg + ';--r-lg:24px"><span class="pill pill-ad ad-label">Patrocinado</span><span class="small" style="opacity:.8">' + esc(l1.loja) + '</span><h3 style="color:inherit;font-size:24px">' + esc(l1.titulo) + '</h3><span style="opacity:.85">' + esc(l1.sub) + '</span><span class="btn" style="background:#fff;color:' + l1.bg + '">' + esc(l1.cta) + '</span></a>' +
      '<div class="card stack" style="--gap:8px"><b>Lojas desta categoria</b>' + STORES.filter(function (s) { return all.some(function (p) { return p.loja === s.id; }); }).map(function (s) { return '<a class="row small" href="#/loja/' + s.id + '"><span class="store-logo" style="width:32px;height:32px;font-size:12px;border-radius:10px;background:' + s.cor + '">' + initials(s.nome) + '</span>' + esc(s.nome) + '</a>'; }).join('') + '</div></aside></div>';
    return shopLayout(content, 'c-' + id);
  }

  function vOfertas(q) {
    var list = sortList(applyF(PRODUCTS.filter(function (p) { return q.ord === 'vendidos' ? true : p.de; }), q.f), q.ord || 'desconto');
    var content = '<div class="page-head" style="margin-top:18px"><div class="stack" style="--gap:2px"><span class="kicker" style="font-size:12px;font-weight:700;letter-spacing:.1em;color:#1F4FA3;text-transform:uppercase">Todas as lojas</span><h1>' + (q.ord === 'vendidos' ? 'Mais vendidos' : 'Ofertas de ' + CITY.nome) + '</h1></div></div><div class="section stack">' + filterBar('#/ofertas', q) + '<div class="grid-products">' + list.map(function (p) { return pcard(p); }).join('') + '</div></div>';
    return shopLayout(content, 'home');
  }

  function vBusca(q) {
    var term = (q.q || '').trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) { var s = store(p.loja); return !term || (p.nome + ' ' + cat(p.cat).nome + ' ' + s.nome).toLowerCase().indexOf(term) >= 0; });
    var content = '<div class="page-head" style="margin-top:18px"><h1>' + (term ? 'Resultados para “' + esc(q.q) + '”' : 'Todos os produtos') + '</h1><span class="small muted">' + list.length + ' produtos</span></div>' +
      '<div class="section">' + (list.length ? '<div class="grid-products">' + list.map(function (p) { return pcard(p); }).join('') + '</div>' : emptyBox('search', 'Nada encontrado em ' + CITY.nome, 'Confira a ortografia ou navegue pelas categorias.', '<a class="btn btn-primary" href="#/categorias">Ver categorias</a>')) + '</div>';
    return shopLayout(content, 'home');
  }

  function vLojas() {
    var content = '<div class="page-head" style="margin-top:18px"><div class="stack" style="--gap:2px"><h1>Lojas de ' + CITY.nome + '</h1><span class="muted small">Todas aprovadas pela equipe ' + CITY.marca + ', com CNPJ e endereço na cidade.</span></div></div><div class="section grid-stores">' + STORES.map(storeCard).join('') + '</div>';
    return shopLayout(content, 'home');
  }

  function vLoja(id) {
    var st = store(id); if (!st) return vNotFound();
    var list = PRODUCTS.filter(function (p) { return p.loja === id; });
    var content = '<nav class="crumbs"><a href="#/">Início</a>' + ic('chevR', 'ico-sm') + '<a href="#/lojas">Lojas</a>' + ic('chevR', 'ico-sm') + '<span>' + esc(st.nome) + '</span></nav>' +
      '<div class="card stitch" style="margin-top:12px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;--r-lg:24px;padding:22px"><span class="store-logo" style="width:76px;height:76px;font-size:26px;border-radius:22px;background:' + st.cor + '">' + initials(st.nome) + '</span>' +
      '<div class="stack grow" style="--gap:6px"><div class="row wrap"><h1>' + esc(st.nome) + '</h1>' + seloPill(st) + '</div><span class="muted small row wrap" style="--gap:6px">' + ic('star', 'ico-sm') + st.nota.toFixed(1) + ' (' + st.avaliacoes + ' avaliações) · ' + esc(st.bairro) + ', ' + CITY.nome + ' · ' + esc(cat(st.cat).nome) + '</span>' +
      '<div class="row wrap"><span class="pill pill-local">' + ic('pin', 'ico-sm') + 'Loja de ' + CITY.nome + '</span>' + (st.entrega ? '<span class="pill pill-indicada">' + ic('truck', 'ico-sm') + 'Entrega · ' + st.prazo + '</span>' : '') + (st.retirada ? '<span class="pill pill-indicada">' + ic('store', 'ico-sm') + 'Retirada grátis</span>' : '') + '</div></div>' +
      '<button class="btn btn-ghost" data-act="toast" data-msg="Você vai receber as novidades desta loja.">' + ic('heart', 'ico-sm') + 'Seguir loja</button></div>' +
      '<div class="section"><div class="section-head"><h2>Produtos da loja</h2><span class="small muted">' + list.length + ' itens</span></div><div class="grid-products">' + list.map(function (p) { return pcard(p); }).join('') + '</div></div>' +
      '<div class="legal-box">' + ic('info', 'ico-sm') + ' Fornecedor: <b>' + esc(st.nome) + '</b> · CNPJ ' + st.cnpj + ' · ' + esc(st.bairro) + ', ' + CITY.nome + '/' + CITY.uf + ' · Atendimento pelo chat do pedido.</div>';
    return shopLayout(content, 'home');
  }

  function vProduto(id) {
    var p = prod(id); if (!p) return vNotFound();
    var st = store(p.loja), c = cat(p.cat), off = offPct(p), d = DISP[p.disp];
    var sel = (S.pdpVar && S.pdpVar.id === id) ? S.pdpVar.v : null, qty = (S.pdpQty && S.pdpQty.id === id) ? S.pdpQty.n : 1;
    var naCidade = cepNaCidade();
    var frete = freteLoja(st);
    var varHtml = p.var ? '<div class="stack" style="--gap:8px"><span class="label">' + p.var.nome + ': <b>' + (sel || 'escolha uma opção') + '</b></span><div class="row wrap" role="group" aria-label="' + p.var.nome + '">' + p.var.opcoes.map(function (o) { return '<button class="opt" data-act="var" data-id="' + id + '" data-v="' + o + '" aria-pressed="' + (sel === o) + '">' + o + '</button>'; }).join('') + '</div></div>' : '';
    var buyDisabled = p.disp === 'esgotado' || !naCidade;
    var content = '<nav class="crumbs"><a href="#/">Início</a>' + ic('chevR', 'ico-sm') + '<a href="#/c/' + c.id + '">' + c.nome + '</a>' + ic('chevR', 'ico-sm') + '<span>' + esc(p.nome) + '</span></nav>' +
      '<div class="pdp"><div>' + art(p, 'gallery-main', '<div class="flags" style="position:absolute;top:14px;left:14px;display:flex;gap:6px">' + (off ? '<span class="pill pill-sale">−' + off + '%</span>' : '') + (p.kit ? '<span class="pill pill-indicada">Kit</span>' : '') + '</div>') +
      '<div class="thumbs" aria-hidden="true">' + [0, 1, 2, 3].map(function (i) { return '<span class="' + (i === 0 ? 'on' : '') + '" style="background:' + c.tint + '"></span>'; }).join('') + '</div>' +
      '<p class="xs muted" style="margin-top:8px">Proporção da mídia: ' + (p.cat === 'moda' ? '4:5 (moda)' : '1:1') + '. Vídeo do produto em 9:16 quando houver.</p></div>' +
      '<div class="stack" style="--gap:16px">' +
      '<div class="stack" style="--gap:8px"><div class="row wrap"><span class="pill pill-local">' + ic('pin', 'ico-sm') + 'Loja de ' + CITY.nome + '</span>' + seloPill(st) + '<span class="status ' + d[1] + '">' + d[0] + '</span></div>' +
      '<h1 style="font-size:26px;line-height:1.2">' + esc(p.nome) + '</h1><a class="small" href="#/loja/' + st.id + '">Vendido por <b>' + esc(st.nome) + '</b> · ' + ic('star', 'ico-sm') + st.nota.toFixed(1) + '</a></div>' +
      '<div class="stack" style="--gap:2px">' + (p.de ? '<span class="muted" style="text-decoration:line-through">' + money(p.de) + '</span>' : '') + '<div class="row"><span class="price-big">' + money(p.preco) + '</span>' + (off ? '<span class="pill pill-local" style="font-size:13px">' + off + '% OFF</span>' : '') + '</div><span class="small muted">no Pix ou cartão · parcelamento conforme o provedor de pagamento</span></div>' +
      varHtml +
      '<div class="row wrap"><div class="qty" aria-label="Quantidade"><button data-act="qtypdp" data-id="' + id + '" data-d="-1" aria-label="Diminuir">' + ic('minus') + '</button><span>' + qty + '</span><button data-act="qtypdp" data-id="' + id + '" data-d="1" aria-label="Aumentar">' + ic('plus') + '</button></div>' +
      '<button class="btn btn-primary btn-lg grow" data-act="add" data-id="' + id + '"' + (buyDisabled ? ' disabled' : '') + '>' + ic('bag') + 'Adicionar à sacola</button></div>' +
      '<button class="btn btn-dark btn-lg" data-act="buy" data-id="' + id + '"' + (buyDisabled ? ' disabled' : '') + '>Comprar agora</button>' +
      (!naCidade ? '<div class="banner-info red">' + ic('alert') + '<span>O CEP <b>' + esc(S.cep) + '</b> está fora da área atendida pelas lojas de ' + CITY.nome + '. <button class="btn btn-sm btn-ghost" data-act="cep" style="margin-top:6px">Trocar CEP</button></span></div>' : '') +
      '<div class="ship-box">' +
      '<div>' + ic('truck', 'ico-lg') + '<div class="grow stack" style="--gap:2px"><b>Entrega ' + (st.entrega && naCidade ? '· ' + st.prazo : 'indisponível') + '</b><span class="small muted">' + (st.entrega && naCidade ? 'Frete estimado ' + money(frete) + ' para ' + esc(S.cep) + ' (calculado pela distância nas ruas × tarifa da loja)' : 'Fora da cobertura desta loja') + '</span></div><button class="btn btn-sm btn-ghost" data-act="cep">Alterar</button></div>' +
      '<div>' + ic('store', 'ico-lg') + '<div class="grow stack" style="--gap:2px"><b>' + (st.retirada && naCidade ? 'Retirada grátis na loja' : 'Retirada indisponível') + '</b><span class="small muted">' + (st.retirada ? esc(st.bairro) + ', ' + CITY.nome + ' · somente para compradores da mesma cidade' : 'Esta loja não oferece retirada') + '</span></div></div>' +
      '<div>' + ic('refresh', 'ico-lg') + '<div class="grow stack" style="--gap:2px"><b>7 dias para desistir</b><span class="small muted">Devolução gratuita por arrependimento em compras online (art. 49 do CDC).</span></div></div></div>' +
      '<div class="card seller-box"><span class="store-logo" style="background:' + st.cor + '">' + initials(st.nome) + '</span><div class="grow stack" style="--gap:2px"><b>' + esc(st.nome) + '</b><span class="xs muted">CNPJ ' + st.cnpj + ' · ' + esc(st.bairro) + ', ' + CITY.nome + '/' + CITY.uf + '</span></div><a class="btn btn-sm btn-soft" href="#/loja/' + st.id + '">Ver loja</a></div>' +
      '</div></div>' +
      '<section class="section card stack"><h2>Descrição</h2><p class="muted" style="margin:0">[Descrição do produto escrita pelo lojista. Conteúdo novo ou alterado passa por moderação antes de aparecer; preço e estoque atualizam na hora.]</p><div class="spec"><div><b>Categoria</b>' + c.nome + '</div><div><b>Disponibilidade</b>' + d[0] + '</div><div><b>Garantia</b>Legal de 90 dias (CDC) + a do fabricante</div><div><b>Nota fiscal</b>Emitida pela loja vendedora</div></div></section>' +
      rail('mais-loja', 'Mais de ' + esc(st.nome), PRODUCTS.filter(function (x) { return x.loja === st.id && x.id !== id; }).concat(PRODUCTS.filter(function (x) { return x.cat === p.cat && x.loja !== st.id; })).slice(0, 8), {}) +
      '<div class="buybar"><div class="stack grow" style="--gap:0"><span class="xs muted">' + (p.de ? '<s>' + money(p.de) + '</s>' : '&nbsp;') + '</span><b style="font-family:var(--f-titulo);font-size:20px;color:#14213D">' + money(p.preco) + '</b></div><button class="btn btn-primary" data-act="add" data-id="' + id + '"' + (buyDisabled ? ' disabled' : '') + '>' + ic('bag') + 'Adicionar</button></div>';
    return shopLayout(content, 'c-' + p.cat, 'pdp-page');
  }

  function groupCart() {
    var g = {};
    S.cart.forEach(function (i) { var p = prod(i.id); if (!p) return; (g[p.loja] = g[p.loja] || []).push({ item: i, p: p }); });
    return Object.keys(g).map(function (k) { return { st: store(k), linhas: g[k] }; });
  }
  function totals() {
    var groups = groupCart(), sub = 0, frete = 0;
    groups.forEach(function (g) {
      var s = g.linhas.reduce(function (a, l) { return a + l.p.preco * l.item.qty; }, 0); sub += s;
      var modo = S.checkout.modos[g.st.id] || 'entrega';
      if (modo === 'entrega') frete += freteFinal(g.st);
    });
    return { groups: groups, sub: sub, frete: frete, total: sub + frete };
  }
  function vSacola() {
    if (!S.cart.length) return shopLayout(emptyBox('bag', 'Sua sacola está vazia', 'Navegue pelas lojas de ' + CITY.nome + ' e adicione o que quiser. Você não precisa de conta para montar a sacola.', '<a class="btn btn-primary" href="#/">Começar a comprar</a>'), 'cart');
    var t = totals();
    var content = '<div class="page-head" style="margin-top:18px"><h1>Sacola</h1><span class="small muted">' + cartCount() + ' itens de ' + t.groups.length + ' loja' + (t.groups.length > 1 ? 's' : '') + '</span></div>' +
      '<div class="two-col"><div class="stack" style="--gap:14px">' +
      (t.groups.length > 1 ? '<div class="banner-info blue">' + ic('info') + '<span>Compra em mais de uma loja: você paga tudo de uma vez e cada loja entrega ou separa a sua parte. O frete é por loja.</span></div>' : '') +
      t.groups.map(function (g) {
        return '<div class="cart-store"><div class="cart-store-head"><span class="store-logo" style="width:36px;height:36px;font-size:13px;border-radius:10px;background:' + g.st.cor + '">' + initials(g.st.nome) + '</span><b class="grow">' + esc(g.st.nome) + '</b><span class="xs muted">' + (g.st.entrega ? 'Entrega ' + g.st.prazo.toLowerCase() : '') + (g.st.retirada ? ' · retirada grátis' : '') + '</span></div>' + (g.st.freteGratis ? '<div style="padding:10px 16px;border-bottom:1px solid #E3E1DA">' + freteGratisInfo(g.st) + '</div>' : '') +
          g.linhas.map(function (l) {
            return '<div class="cart-item"><a class="thumb" href="#/p/' + l.p.id + '" style="background:' + cat(l.p.cat).tint + '" aria-label="' + esc(l.p.nome) + '"><svg viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICON[cat(l.p.cat).icon] + '"/></svg></a>' +
              '<div class="grow stack" style="--gap:4px"><a href="#/p/' + l.p.id + '" style="color:#1A1F2B;font-weight:500;font-size:14px">' + esc(l.p.nome) + '</a>' + (l.item.v ? '<span class="xs muted">' + l.p.var.nome + ': ' + esc(l.item.v) + '</span>' : '') + '<span class="status ' + DISP[l.p.disp][1] + '" style="align-self:flex-start">' + DISP[l.p.disp][0] + '</span>' +
              '<div class="row between wrap"><div class="qty"><button data-act="qty" data-k="' + l.item.k + '" data-d="-1" aria-label="Diminuir">' + ic('minus') + '</button><span>' + l.item.qty + '</span><button data-act="qty" data-k="' + l.item.k + '" data-d="1" aria-label="Aumentar">' + ic('plus') + '</button></div><b style="font-family:var(--f-titulo);font-size:18px;color:#14213D">' + money(l.p.preco * l.item.qty) + '</b></div>' +
              '<button class="btn btn-sm" style="align-self:flex-start;padding:0;min-height:30px;background:none;color:#4A5468" data-act="rm" data-k="' + l.item.k + '">' + ic('trash', 'ico-sm') + 'Remover</button></div></div>';
          }).join('') + '</div>';
      }).join('') + '</div>' +
      '<aside class="card stack sticky-col" style="--gap:12px"><h2>Resumo</h2><div class="summary-line"><span>Produtos</span><span>' + money(t.sub) + '</span></div><div class="summary-line"><span>Frete (' + t.groups.length + ' loja' + (t.groups.length > 1 ? 's' : '') + ')</span><span>calculado no próximo passo</span></div><div class="summary-total"><span>Total</span><span>' + money(t.sub) + '</span></div>' +
      '<a class="btn btn-primary btn-lg btn-block" href="' + (S.user ? '#/checkout' : '#/entrar?next=checkout') + '">Continuar a compra</a>' +
      (S.user ? '' : '<span class="xs muted" style="text-align:center">Para fechar a compra você entra ou cria sua conta. Sua sacola fica guardada.</span>') +
      '<span class="xs muted row" style="--gap:6px;justify-content:center">' + ic('lock', 'ico-sm') + 'Pagamento protegido · Pix ou cartão</span></aside></div>';
    return shopLayout(content, 'cart');
  }

  function stepsBar(cur) {
    var steps = [['entrega', 'Entrega'], ['pagamento', 'Pagamento'], ['revisao', 'Revisão']], idx = steps.map(function (s) { return s[0]; }).indexOf(cur);
    return '<div class="steps" aria-label="Etapas da compra">' + steps.map(function (s, i) { return '<div class="' + (i < idx ? 'done' : i === idx ? 'on' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '>' + (i + 1) + '. ' + s[1] + '</div>'; }).join('') + '</div>';
  }
  function vCheckout() {
    if (!S.cart.length) { location.hash = '#/sacola'; return vSacola(); }
    if (!S.user) { location.hash = '#/entrar?next=checkout'; return vEntrar({ next: 'checkout' }); }
    var step = S.checkout.step || 'entrega', t = totals(), body = '';
    var end = S.user.endereco || { rua: '', numero: '', bairro: '', cep: S.cep, complemento: '' };
    if (step === 'entrega') {
      body = '<div class="card stack"><h2>Endereço de entrega</h2><form class="stack" data-form="endereco"><div class="grid-2"><div class="field"><label for="e-cep">CEP</label><input class="input" id="e-cep" name="cep" value="' + esc(end.cep || S.cep) + '" inputmode="numeric" required></div><div class="field"><label for="e-bairro">Bairro</label><input class="input" id="e-bairro" name="bairro" value="' + esc(end.bairro) + '" required></div></div>' +
        '<div class="grid-2"><div class="field"><label for="e-rua">Rua</label><input class="input" id="e-rua" name="rua" value="' + esc(end.rua) + '" required></div><div class="grid-2"><div class="field"><label for="e-num">Número</label><input class="input" id="e-num" name="numero" value="' + esc(end.numero) + '" required></div><div class="field"><label for="e-comp">Complemento</label><input class="input" id="e-comp" name="complemento" value="' + esc(end.complemento) + '"></div></div></div>' +
        '<span class="hint">Cidade: ' + CITY.nome + '/' + CITY.uf + '. Ao trocar o CEP, revalidamos se cada loja entrega ou permite retirada.</span></form></div>' +
        t.groups.map(function (g) {
          var modo = S.checkout.modos[g.st.id] || (g.st.entrega ? 'entrega' : 'retirada');
          var podeRet = g.st.retirada && cepNaCidade();
          return '<div class="card stack"><div class="row"><span class="store-logo" style="width:36px;height:36px;font-size:13px;border-radius:10px;background:' + g.st.cor + '">' + initials(g.st.nome) + '</span><b class="grow">' + esc(g.st.nome) + '</b><span class="xs muted">' + g.linhas.length + ' item(ns)</span></div>' +
            '<label class="radio-card' + (modo === 'entrega' ? ' on' : '') + (g.st.entrega ? '' : ' disabled') + '"><input type="radio" name="m-' + g.st.id + '" data-act="modo" data-st="' + g.st.id + '" data-v="entrega"' + (modo === 'entrega' ? ' checked' : '') + (g.st.entrega ? '' : ' disabled') + '><span class="grow stack" style="--gap:2px"><b>Entrega · ' + g.st.prazo + '</b><span class="small muted">Frete ' + (freteFinal(g.st) ? money(freteFinal(g.st)) : '<b style="color:#145E3D">grátis</b>') + ' · previsão após confirmação do pagamento</span></span></label>' +
            '<label class="radio-card' + (modo === 'retirada' ? ' on' : '') + (podeRet ? '' : ' disabled') + '"><input type="radio" name="m-' + g.st.id + '" data-act="modo" data-st="' + g.st.id + '" data-v="retirada"' + (modo === 'retirada' ? ' checked' : '') + (podeRet ? '' : ' disabled') + '><span class="grow stack" style="--gap:2px"><b>Retirar na loja · grátis</b><span class="small muted">' + (podeRet ? esc(g.st.bairro) + ', ' + CITY.nome + ' · avisamos quando estiver pronto' : 'Indisponível para este endereço ou loja') + '</span></span></label></div>';
        }).join('') +
        '<button class="btn btn-primary btn-lg" data-act="step" data-v="pagamento">Ir para o pagamento</button>';
    } else if (step === 'pagamento') {
      var pg = S.checkout.pagamento;
      body = '<div class="card stack"><h2>Como você quer pagar?</h2>' +
        '<label class="radio-card' + (pg === 'pix' ? ' on' : '') + '"><input type="radio" name="pg" data-act="pg" data-v="pix"' + (pg === 'pix' ? ' checked' : '') + '><span class="row grow">' + ic('pix', 'ico-lg') + '<span class="stack" style="--gap:2px"><b>Pix</b><span class="small muted">Aprovação na hora. O código vale por 30 minutos.</span></span></span></label>' +
        '<label class="radio-card' + (pg === 'cartao' ? ' on' : '') + '"><input type="radio" name="pg" data-act="pg" data-v="cartao"' + (pg === 'cartao' ? ' checked' : '') + '><span class="row grow">' + ic('card', 'ico-lg') + '<span class="stack" style="--gap:2px"><b>Cartão de crédito</b><span class="small muted">Parcelamento conforme o provedor de pagamento.</span></span></span></label>' +
        (pg === 'cartao' ? '<div class="stack" style="--gap:12px;padding-top:4px"><div class="field"><label for="c-num">Número do cartão</label><input class="input" id="c-num" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000"></div><div class="grid-2"><div class="field"><label for="c-nome">Nome impresso</label><input class="input" id="c-nome" autocomplete="cc-name"></div><div class="grid-2"><div class="field"><label for="c-val">Validade</label><input class="input" id="c-val" autocomplete="cc-exp" placeholder="MM/AA"></div><div class="field"><label for="c-cvv">CVV</label><input class="input" id="c-cvv" autocomplete="cc-csc" inputmode="numeric"></div></div></div><div class="field"><label for="c-parc">Parcelas</label><select class="select" id="c-parc"><option>1x de ' + money(t.total) + '</option><option>2x de ' + money(t.total / 2) + '</option><option>3x de ' + money(t.total / 3) + '</option></select></div>' +
          '<div class="banner-info blue">' + ic('lock') + '<span class="small">Os dados do cartão vão direto para o provedor de pagamento (tokenização). O ' + CITY.marca + ' não armazena número nem CVV.</span></div></div>' : '') +
        '</div><div class="card stack"><h2>Nota fiscal</h2><div class="field"><label for="nf-cpf">CPF para a nota</label><input class="input" id="nf-cpf" value="' + esc(S.user.cpf || '') + '" inputmode="numeric"></div><span class="hint">Cada loja emite a nota da sua parte da compra.</span></div>' +
        '<div class="row"><button class="btn btn-ghost" data-act="step" data-v="entrega">' + ic('chevL', 'ico-sm') + 'Voltar</button><button class="btn btn-primary btn-lg grow" data-act="step" data-v="revisao">Revisar pedido</button></div>';
    } else {
      body = '<div class="card stack"><h2>Revise antes de pagar</h2>' + t.groups.map(function (g) {
        var modo = S.checkout.modos[g.st.id] || 'entrega';
        return '<div class="stack" style="--gap:6px;padding:12px 0;border-top:1px solid #E3E1DA"><div class="row between"><b>' + esc(g.st.nome) + '</b><span class="pill ' + (modo === 'entrega' ? 'pill-indicada' : 'pill-local') + '">' + (modo === 'entrega' ? 'Entrega · ' + g.st.prazo : 'Retirada na loja') + '</span></div>' +
          g.linhas.map(function (l) { return '<div class="summary-line"><span>' + l.item.qty + '× ' + esc(l.p.nome) + (l.item.v ? ' (' + esc(l.item.v) + ')' : '') + '</span><span>' + money(l.p.preco * l.item.qty) + '</span></div>'; }).join('') +
          (modo === 'entrega' ? '<div class="summary-line"><span>Frete da loja</span><span>' + (freteFinal(g.st) ? money(freteFinal(g.st)) : 'Grátis') + '</span></div>' : '') + '<span class="xs muted">Vendido e entregue por ' + esc(g.st.nome) + ' · CNPJ ' + g.st.cnpj + '</span></div>';
      }).join('') + '</div>' +
        '<div class="card stack"><h2>Pagamento</h2><span>' + (S.checkout.pagamento === 'pix' ? 'Pix — o código aparece na próxima tela' : 'Cartão de crédito') + '</span></div>' +
        '<div class="legal-box stack" style="--gap:6px"><b style="color:#14213D">Resumo das condições</b><span>• Você pode desistir em até 7 dias após o recebimento, com reembolso integral (art. 49 do CDC).</span><span>• O prazo de entrega começa a contar após a confirmação do pagamento.</span><span>• Trocas por defeito seguem a garantia legal de 90 dias.</span><span>• Seus dados são tratados conforme a <a href="#/privacidade">Política de Privacidade</a> (LGPD).</span></div>' +
        '<div class="row"><button class="btn btn-ghost" data-act="step" data-v="pagamento">' + ic('chevL', 'ico-sm') + 'Voltar</button><button class="btn btn-green btn-lg grow" data-act="finalizar">' + ic('lock', 'ico-sm') + 'Confirmar e pagar ' + money(t.total) + '</button></div>';
    }
    var content = '<div class="page-head" style="margin-top:18px"><h1>Finalizar compra</h1><a class="small" href="#/sacola">Voltar à sacola</a></div>' + stepsBar(step) +
      '<div class="two-col"><div class="stack" style="--gap:14px">' + body + '</div>' +
      '<aside class="card stack sticky-col" style="--gap:10px"><h2>Resumo</h2><div class="summary-line"><span>Produtos</span><span>' + money(t.sub) + '</span></div><div class="summary-line"><span>Fretes</span><span>' + (t.frete ? money(t.frete) : 'Grátis') + '</span></div><div class="summary-total"><span>Total</span><span>' + money(t.total) + '</span></div><span class="xs muted">Valores, estoque e cobertura são conferidos de novo pelo servidor ao confirmar.</span></aside></div>';
    return shopLayout(content, 'cart');
  }

  function vPedido(id) {
    var o = S.orders.find(function (x) { return x.id === id; }); if (!o) return vNotFound();
    var pago = o.pago;
    var qr = ''; for (var i = 0; i < 144; i++) { qr += '<i class="' + (((i * 7 + (i >> 3) * 5) % 3 === 0 || [0, 1, 12, 13, 10, 11, 22, 23, 120, 121, 132, 133].indexOf(i) >= 0) ? '' : 'o') + '"></i>'; }
    var content = '<div class="auth-wrap" style="max-width:760px"><div class="auth-card">' +
      (pago ? '<div class="banner-info green">' + ic('check') + '<span><b>Pagamento confirmado!</b> As lojas já foram avisadas e começaram a separar seu pedido.</span></div>' :
        (o.pagamento === 'pix' ? '<div class="stack" style="--gap:12px"><h1>Pague com Pix para confirmar</h1><div class="pix-box"><div class="qr" aria-label="QR Code Pix (demonstração)">' + qr + '</div><div class="stack grow" style="--gap:8px"><span class="muted small">Abra o app do seu banco e escaneie, ou copie o código:</span><span class="kbd" style="word-break:break-all">00020126…' + o.id + '…6304</span><button class="btn btn-ghost btn-sm" data-act="toast" data-msg="Código Pix copiado.">' + ic('copy', 'ico-sm') + 'Copiar código</button><span class="xs muted">Válido por 30 min. Demonstração: <button class="btn btn-sm btn-soft" data-act="pagar" data-id="' + o.id + '">Simular pagamento</button></span></div></div></div>' : '<div class="banner-info blue">' + ic('clock') + '<span>Aguardando a confirmação do cartão pelo provedor. <button class="btn btn-sm btn-soft" data-act="pagar" data-id="' + o.id + '">Simular aprovação</button></span></div>')) +
      '<div class="row between wrap"><h2>Pedido nº ' + o.id + '</h2><span class="small muted">' + o.data + '</span></div>' +
      o.sub.map(function (s) {
        var st = store(s.loja), flow = s.modo === 'entrega' ? ['realizado', 'pagamento_confirmado', 'em_separacao', 'pronto_envio', 'saiu_entrega', 'entregue'] : ['realizado', 'pagamento_confirmado', 'em_separacao', 'pronto_retirada', 'retirado'];
        var cur = pago ? 1 : 0;
        return '<div class="card stack" style="--gap:10px"><div class="row between wrap"><b>' + o.id + '-' + s.letra + ' · ' + esc(st.nome) + '</b><span class="pill ' + (s.modo === 'entrega' ? 'pill-indicada' : 'pill-local') + '">' + (s.modo === 'entrega' ? 'Entrega' : 'Retirada') + '</span></div><div class="timeline">' + flow.map(function (f, i) { return '<div class="' + (i < cur ? 'done' : i === cur ? 'cur' : '') + '"><span>' + OST[f] + '</span></div>'; }).join('') + '</div>' +
          '<a class="btn btn-sm btn-ghost" style="align-self:flex-start" href="#/conta/pedidos">' + ic('receipt', 'ico-sm') + 'Chat com a loja (após a compra)</a></div>';
      }).join('') +
      '<div class="summary-total"><span>Total</span><span>' + money(o.total) + '</span></div><div class="row wrap"><a class="btn btn-primary" href="#/conta/pedidos">Ver meus pedidos</a><a class="btn btn-ghost" href="#/">Continuar comprando</a></div></div></div>';
    return shopLayout(content, 'account');
  }

  function vEntrar(q) {
    var next = q.next || '';
    var content = '<div class="auth-wrap"><div class="auth-card"><div class="stack" style="--gap:4px"><h1>Entrar</h1><span class="muted small">' + (next === 'checkout' ? 'Falta pouco: entre para fechar a compra. Sua sacola continua aqui.' : 'Acompanhe pedidos, endereços e favoritos.') + '</span></div>' +
      '<form class="stack" data-form="login" data-next="' + esc(next) + '"><div class="field"><label for="l-email">E-mail</label><input class="input" id="l-email" name="email" type="email" autocomplete="email" required></div><div class="field"><label for="l-senha">Senha</label><input class="input" id="l-senha" name="senha" type="password" autocomplete="current-password" required></div><a class="small" href="#/entrar" data-act="toast" data-msg="Enviamos um link de recuperação para o seu e-mail." style="align-self:flex-end">Esqueci minha senha</a><button class="btn btn-primary btn-lg" type="submit">Entrar</button></form>' +
      '<div class="row" style="--gap:10px"><span style="flex:1;height:1px;background:#E3E1DA"></span><span class="xs muted">ou</span><span style="flex:1;height:1px;background:#E3E1DA"></span></div>' +
      '<a class="btn btn-ghost btn-lg" href="#/cadastro' + (next ? '?next=' + next : '') + '">Criar conta grátis</a></div></div>';
    return shopLayout(content, 'account');
  }
  function vCadastro(q) {
    var next = q.next || '';
    var content = '<div class="auth-wrap"><div class="auth-card"><div class="stack" style="--gap:4px"><h1>Criar conta</h1><span class="muted small">Só pedimos o necessário para entregar e emitir a nota fiscal.</span></div>' +
      '<form class="stack" data-form="cadastro" data-next="' + esc(next) + '" novalidate>' +
      '<div class="field"><label for="c-nome">Nome completo</label><input class="input" id="c-nome" name="nome" autocomplete="name" required></div>' +
      '<div class="grid-2"><div class="field"><label for="c-cpf">CPF</label><input class="input" id="c-cpf" name="cpf" inputmode="numeric" required><span class="hint">Obrigatório para a nota fiscal.</span></div><div class="field"><label for="c-cel">Celular (WhatsApp)</label><input class="input" id="c-cel" name="celular" inputmode="tel" autocomplete="tel" required><span class="hint">Avisos do pedido.</span></div></div>' +
      '<div class="field"><label for="c-email">E-mail</label><input class="input" id="c-email" name="email" type="email" autocomplete="email" required></div>' +
      '<div class="field"><label for="c-senha">Senha</label><input class="input" id="c-senha" name="senha" type="password" autocomplete="new-password" minlength="8" required><span class="hint">Mínimo de 8 caracteres, com letras e números.</span></div>' +
      '<label class="check"><input type="checkbox" name="termos" required><span>Li e aceito os <a href="#/termos" target="_blank">Termos de Uso</a> e a <a href="#/privacidade" target="_blank">Política de Privacidade</a>. <b>(obrigatório)</b></span></label>' +
      '<label class="check"><input type="checkbox" name="idade" required><span>Declaro ter 18 anos ou mais. <b>(obrigatório)</b></span></label>' +
      '<label class="check"><input type="checkbox" name="marketing"><span>Quero receber ofertas das lojas de ' + CITY.nome + ' por e-mail e WhatsApp. (opcional, você pode cancelar quando quiser)</span></label>' +
      '<div class="legal-box">' + ic('shield', 'ico-sm') + ' Seus dados são usados para processar compras, entregas e notas fiscais (execução de contrato), e cada loja só recebe o necessário para atender o seu pedido. Você pode acessar, corrigir, baixar ou excluir seus dados em Conta › Privacidade.</div>' +
      '<div class="banner-info red" data-err hidden>' + ic('alert') + '<span>Preencha os campos obrigatórios e aceite os termos.</span></div>' +
      '<button class="btn btn-primary btn-lg" type="submit">Criar conta' + (next === 'checkout' ? ' e continuar' : '') + '</button></form>' +
      '<span class="small muted" style="text-align:center">Já tem conta? <a href="#/entrar' + (next ? '?next=' + next : '') + '">Entrar</a></span></div></div>';
    return shopLayout(content, 'account');
  }

  function accountShell(tab, inner) {
    if (!S.user) { location.hash = '#/entrar'; return vEntrar({}); }
    var items = [['dados', 'user', 'Meus dados'], ['pedidos', 'receipt', 'Pedidos'], ['enderecos', 'pin', 'Endereços'], ['favoritos', 'heart', 'Favoritos'], ['privacidade', 'shield', 'Privacidade e dados']];
    var content = '<div class="page-head" style="margin-top:18px"><h1>Olá, ' + esc(S.user.nome.split(' ')[0]) + '</h1></div><div class="account"><nav class="side-menu" aria-label="Conta">' +
      items.map(function (i) { return '<a href="#/conta/' + i[0] + '" class="' + (tab === i[0] ? 'on' : '') + '">' + ic(i[1]) + i[2] + '</a>'; }).join('') + '<a href="#/" data-act="logout">' + ic('logout') + 'Sair</a></nav><div class="stack" style="--gap:14px">' + inner + '</div></div>';
    return shopLayout(content, 'account');
  }
  function vConta(tab) {
    tab = tab || 'dados';
    if (!S.user) return accountShell(tab, '');
    var inner = '';
    if (tab === 'dados') inner = '<div class="card stack"><h2>Meus dados</h2><div class="grid-2"><div class="field"><label>Nome</label><input class="input" value="' + esc(S.user.nome) + '"></div><div class="field"><label>E-mail</label><input class="input" value="' + esc(S.user.email) + '"></div><div class="field"><label>CPF</label><input class="input" value="' + esc(S.user.cpf || '') + '" disabled></div><div class="field"><label>Celular</label><input class="input" value="' + esc(S.user.celular || '') + '"></div></div><span class="hint">Alterar o cadastro não muda os dados de compras já feitas.</span><button class="btn btn-primary" style="align-self:flex-start" data-act="toast" data-msg="Dados atualizados.">Salvar</button></div>';
    else if (tab === 'pedidos') inner = S.orders.length ? S.orders.map(function (o) { return '<a class="card row between wrap" href="#/pedido/' + o.id + '" style="color:inherit"><span class="stack" style="--gap:2px"><b>Pedido nº ' + o.id + '</b><span class="small muted">' + o.data + ' · ' + o.sub.length + ' loja(s) · ' + money(o.total) + '</span></span><span class="status ' + (o.pago ? 'st-green' : 'st-amber') + '">' + (o.pago ? 'Pagamento confirmado' : 'Aguardando pagamento') + '</span></a>'; }).join('') : emptyBox('receipt', 'Nenhum pedido ainda', 'Quando você comprar, os pedidos aparecem aqui, separados por loja.', '<a class="btn btn-primary" href="#/">Ir às compras</a>');
    else if (tab === 'enderecos') inner = '<div class="card stack"><h2>Endereços</h2>' + (S.user.endereco ? '<div class="radio-card on"><span class="grow">' + esc(S.user.endereco.rua + ', ' + S.user.endereco.numero + ' — ' + S.user.endereco.bairro + ', ' + CITY.nome + ' · ' + S.user.endereco.cep) + '</span><span class="pill pill-indicada">Principal</span></div>' : '<span class="muted">Nenhum endereço salvo. Ele é salvo na sua primeira compra.</span>') + '</div>';
    else if (tab === 'favoritos') { var fl = PRODUCTS.filter(function (p) { return S.favs.indexOf(p.id) >= 0; }); inner = fl.length ? '<div class="grid-products">' + fl.map(function (p) { return pcard(p); }).join('') + '</div>' : emptyBox('heart', 'Sem favoritos', 'Toque no coração dos produtos para guardar aqui.'); }
    else if (tab === 'privacidade') inner = '<div class="card stack"><h2>Privacidade e dados (LGPD)</h2><span class="muted small">Você controla como seus dados são usados.</span>' +
      privRow('Ofertas por e-mail e WhatsApp', 'Comunicação de marketing das lojas e do ' + CITY.marca + '.', !!S.user.marketing, 'marketing') +
      privRow('Cookies de medição', 'Ajudam a melhorar o site. Não identificam você diretamente.', S.cookies === 'todos', 'cookies') +
      privRow('Anúncios personalizados', 'Anúncios com base no que você vê na plataforma.', S.cookies === 'todos', 'ads') +
      '</div><div class="card stack"><h2>Seus direitos</h2><div class="row wrap"><button class="btn btn-ghost" data-act="toast" data-msg="Preparando o arquivo com seus dados. Enviaremos por e-mail em até 15 dias.">' + ic('upload', 'ico-sm') + 'Baixar meus dados</button><button class="btn btn-ghost" data-act="toast" data-msg="Solicitação registrada.">' + ic('edit', 'ico-sm') + 'Corrigir dados</button><button class="btn btn-danger" data-act="toast" data-msg="Pedido de exclusão registrado. Dados exigidos por lei (como notas fiscais) são mantidos pelo prazo legal.">' + ic('trash', 'ico-sm') + 'Excluir minha conta</button></div><span class="small muted">Encarregado de dados (DPO): [nome] · [e-mail do encarregado]</span></div>';
    return accountShell(tab, inner);
  }
  function privRow(t, d, on, k) { return '<div class="row" style="padding:10px 0;border-top:1px solid #EEF0F5"><span class="grow stack" style="--gap:2px"><b style="font-size:14px">' + t + '</b><span class="xs muted">' + d + '</span></span><button class="switch" role="switch" aria-checked="' + on + '" aria-label="' + t + '" data-act="priv" data-k="' + k + '"></button></div>'; }

  function vLegal(kind) {
    var termos = kind === 'termos';
    var content = '<div class="auth-wrap" style="max-width:820px"><div class="auth-card"><h1>' + (termos ? 'Termos de Uso' : 'Política de Privacidade') + '</h1><div class="banner-info amber">' + ic('alert') + '<span>Texto provisório do protótipo. A versão final deve ser redigida e aprovada pelo jurídico.</span></div>' +
      (termos ? '<h3>1. Quem somos</h3><p class="muted">O ' + CITY.marca + ' é uma plataforma que conecta compradores a lojas de ' + CITY.nome + '. Cada loja é a fornecedora dos produtos que vende e responde por eles junto com a plataforma, nos termos do Código de Defesa do Consumidor.</p><h3 id="trocas">2. Arrependimento e trocas</h3><p class="muted">Compras online podem ser canceladas em até 7 dias após o recebimento, com devolução integral dos valores (art. 49 do CDC). Produtos com defeito seguem a garantia legal de 90 dias.</p><h3>3. Pagamentos</h3><p class="muted">Pagamentos são processados por provedor de pagamento parceiro. O valor é repassado a cada loja descontadas comissão e taxas, conforme contrato do lojista.</p><h3>4. Conta</h3><p class="muted">Você pode navegar e montar a sacola sem conta. Para comprar, é preciso cadastro com dados verdadeiros e ter 18 anos ou mais.</p>' :
        '<h3>1. Dados que coletamos</h3><p class="muted">Cadastro (nome, CPF, e-mail, celular), endereços, pedidos e dados de navegação. Dados de cartão ficam com o provedor de pagamento.</p><h3>2. Para que usamos</h3><p class="muted">Executar compras e entregas, emitir notas, prevenir fraudes, cumprir obrigações legais e — só com seu consentimento — enviar ofertas e personalizar anúncios.</p><h3>3. Com quem compartilhamos</h3><p class="muted">Com a loja de cada pedido (só o necessário para entregar), o provedor de pagamento e serviços de entrega e mensagens.</p><h3 id="cookies">4. Cookies</h3><p class="muted">Necessários (sempre ativos), de medição e de anúncios (opcionais). Você muda a escolha a qualquer momento em Conta › Privacidade.</p><h3>5. Seus direitos</h3><p class="muted">Acesso, correção, portabilidade, exclusão e revogação de consentimento. Contato do encarregado: [e-mail].</p>') +
      '</div></div>';
    return shopLayout(content, 'home');
  }

  /* ---------------- Vender: landing ---------------- */
  function vVender() {
    var content = '<section class="hero" style="margin-top:16px"><div class="hero-slide stitch" style="background:#14213D;color:#fff;border-radius:24px;--r-lg:24px;min-height:300px"><span class="deco" style="background:' + CITY.acento + '"></span><span class="kicker" style="font-size:12px;font-weight:700;letter-spacing:.12em;color:#8FB0EA;text-transform:uppercase">Para lojistas de ' + CITY.nome + '</span><h2>Sua loja aberta para a cidade inteira, 24 horas por dia.</h2><p>Cadastre seus produtos, ligue o estoque da loja física e venda com entrega própria ou retirada no balcão.</p><div class="row wrap"><a class="btn btn-lg" style="background:#fff;color:#14213D" href="#/painel/cadastro">Cadastrar minha loja</a><a class="btn btn-lg" style="background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.4)" href="#/painel">Ver o painel (demo)</a></div></div></section>' +
      '<section class="section"><div class="section-head"><h2>Como funciona</h2></div><div class="trust">' +
      '<div>' + ic('doc', 'ico-lg') + '<span><b>1. Cadastro com CNPJ</b>Dados da empresa e da unidade. A equipe aprova em até 2 dias úteis.</span></div>' +
      '<div>' + ic('box', 'ico-lg') + '<span><b>2. Produtos e estoque</b>Cadastre à mão, por planilha ou ligue seu sistema pela API.</span></div>' +
      '<div>' + ic('eye', 'ico-lg') + '<span><b>3. Ative a loja</b>Um botão deixa a loja visível para os compradores.</span></div>' +
      '<div>' + ic('megaphone', 'ico-lg') + '<span><b>4. Anuncie se quiser</b>Escolha uma vaga no mapa do site e dê seu lance.</span></div></div></section>' +
      '<section class="section card stack" style="background:#EEF2FA;border-color:#DCE1EC"><h2>Parceria ' + CITY.associacao + '</h2><span class="muted">Associados da ' + CITY.associacao + ' têm condições especiais de adesão e apoio para começar a vender. [Condições a definir com a associação.]</span></section>';
    return shopLayout(content, 'home');
  }

  /* ---------------- Painel do lojista ---------------- */
  function panelLayout(active, content) {
    var sd = S.seller, st = store(sd.lojaId);
    var nav = [['', 'chart', 'Visão geral'], ['pedidos', 'receipt', 'Pedidos'], ['produtos', 'tag', 'Produtos'], ['estoque', 'box', 'Estoque e integração'], ['anuncios', 'megaphone', 'Anúncios'], ['financeiro', 'card', 'Financeiro'], ['vitrine', 'sparkle', 'Vitrine da loja'], ['loja', 'store', 'Minha loja'], ['equipe', 'user', 'Equipe'], ['cadastro', 'doc', 'Cadastro e documentos']];
    var statusTxt = { rascunho: ['Cadastro incompleto', 'st-gray'], em_analise: ['Em análise', 'st-amber'], aprovada: ['Aprovada', 'st-green'], suspensa: ['Suspensa', 'st-red'] }[sd.status];
    var side = '<aside class="panel-side"><a class="brand dark" href="#/" style="padding:0 6px">' + CITY.nome + '<span class="tag">Tem</span></a><span class="xs muted" style="padding:0 6px;margin-top:-10px">Painel do lojista</span>' +
      '<nav aria-label="Painel">' + nav.map(function (n) { return '<a href="#/painel' + (n[0] ? '/' + n[0] : '') + '" class="' + (active === n[0] ? 'on' : '') + '"' + (active === n[0] ? ' aria-current="page"' : '') + '>' + ic(n[1]) + n[2] + '</a>'; }).join('') + '</nav>' +
      '<div class="store-switch"><div class="row"><span class="store-logo" style="width:40px;height:40px;font-size:14px;border-radius:12px;background:' + st.cor + '">' + initials(st.nome) + '</span><span class="stack grow" style="--gap:2px"><b style="font-size:13px">' + esc(st.nome) + '</b><span class="status ' + statusTxt[1] + '" style="align-self:flex-start;font-size:11px;padding:2px 8px">' + statusTxt[0] + '</span></span></div>' +
      '<div class="row" style="background:#F6F7FA;border-radius:14px;padding:10px 12px"><span class="grow stack" style="--gap:0"><b style="font-size:13px">Loja visível</b><span class="xs muted">' + (sd.visivel ? 'Aparece para os compradores' : 'Oculta do marketplace') + '</span></span><button class="switch" role="switch" aria-checked="' + sd.visivel + '" aria-label="Loja visível no marketplace" data-act="visivel"></button></div>' +
      '<a class="btn btn-ghost btn-sm" href="#/loja/' + st.id + '">' + ic('eye', 'ico-sm') + 'Ver minha vitrine</a><a class="btn btn-sm" style="background:none;color:#4A5468" href="#/">' + ic('logout', 'ico-sm') + 'Voltar ao marketplace</a></div></aside>';
    return { cls: 'panel-body', html: '<div class="panel-shell">' + side + '<main class="panel-main">' + content + '</main></div>' };
  }
  function pStatusPill(s) { var m = { pagamento_confirmado: 'st-blue', em_separacao: 'st-amber', pronto_envio: 'st-blue', saiu_entrega: 'st-blue', pronto_retirada: 'st-blue', entregue: 'st-green', retirado: 'st-green', cancelado: 'st-red', realizado: 'st-gray' }; return '<span class="status ' + (m[s] || 'st-gray') + '">' + OST[s] + '</span>'; }
  function nextStatus(o) { var e = ['pagamento_confirmado', 'em_separacao', 'pronto_envio', 'saiu_entrega', 'entregue'], r = ['pagamento_confirmado', 'em_separacao', 'pronto_retirada', 'retirado']; var f = o.tipo === 'Entrega' ? e : r; var i = f.indexOf(o.status); return i >= 0 && i < f.length - 1 ? f[i + 1] : null; }
  function ordersTable(list) {
    return '<div class="table-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Quando</th><th>Tipo</th><th>Itens</th><th>Total</th><th>Situação</th><th></th></tr></thead><tbody>' + list.map(function (o) {
      var nx = nextStatus(o);
      return '<tr><td><b>' + o.id + '</b><br><span class="xs muted">' + o.cliente + '</span></td><td>' + o.quando + '</td><td>' + o.tipo + '</td><td>' + o.itens + '</td><td>' + money(o.total) + '</td><td>' + pStatusPill(o.status) + '</td><td>' + (nx ? '<button class="btn btn-sm btn-soft" data-act="avancar" data-id="' + o.id + '">' + OST[nx] + '</button>' : '<span class="xs muted">Concluído</span>') + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function vPainel() {
    var sd = S.seller;
    var aSeparar = sd.pedidos.filter(function (o) { return o.status === 'pagamento_confirmado' || o.status === 'em_separacao'; }).length;
    var baixo = Object.keys(sd.estoque).filter(function (k) { return sd.estoque[k].saldo <= sd.estoque[k].minimo; }).length;
    var banner = sd.status !== 'aprovada' ? '<div class="banner-info amber">' + ic('clock') + '<span><b>Cadastro em análise.</b> Você pode montar produtos e estoque, mas a loja só aparece para os compradores depois da aprovação. <button class="btn btn-sm btn-soft" data-act="aprovar">Simular aprovação (demo)</button></span></div>' :
      (sd.visivel ? '<div class="banner-info green">' + ic('check') + '<span><b>Sua loja está no ar.</b> Compradores de ' + CITY.nome + ' já veem seus produtos.</span></div>' : '<div class="banner-info amber">' + ic('eye') + '<span><b>Loja oculta.</b> Ative "Loja visível" no menu para voltar a vender.</span></div>');
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><span class="small muted">Terça-feira, 18 de novembro</span><h1>Visão geral</h1></div><a class="btn btn-primary" href="#/painel/produtos/novo">' + ic('plus') + 'Novo produto</a></div>' + banner +
      '<div class="kpis"><div class="kpi dark"><span class="small">Vendas hoje</span><span class="v">' + money(309.7) + '</span><span class="xs">2 pedidos pagos</span></div><div class="kpi"><span class="small muted">Pedidos a separar</span><span class="v">' + aSeparar + '</span><span class="xs muted">Prazo de corte: 15h</span></div><div class="kpi"><span class="small muted">Visitas na vitrine (7 dias)</span><span class="v">1.284</span><span class="xs muted">dado de exemplo</span></div><div class="kpi"><span class="small muted">Estoque baixo</span><span class="v">' + baixo + '</span><span class="xs muted">itens no mínimo</span></div></div>' +
      '<div class="card stack"><h2>O que precisa da sua atenção</h2>' +
      todo('receipt', aSeparar + ' pedidos esperando separação', '#/painel/pedidos') + todo('box', baixo + ' produtos com estoque baixo ou zerado', '#/painel/estoque') + todo('clock', '1 produto aguardando moderação de conteúdo', '#/painel/produtos') + todo('gavel', 'Seu lance na vitrine principal (H1) termina em 2 d 14 h', '#/painel/anuncios?slot=H1') + '</div>' +
      '<div class="row between"><h2>Pedidos recentes</h2><a class="small" href="#/painel/pedidos">Ver todos</a></div>' + ordersTable(sd.pedidos.slice(0, 4)) +
      '<div class="card row wrap between"><span class="row">' + ic('link', 'ico-lg') + '<span class="stack" style="--gap:0"><b>Integração de estoque: ativa</b><span class="small muted">Última sincronização ' + sd.api.ultimaSync + ' · ' + sd.api.falhas24h + ' falhas em 24 h</span></span></span><a class="btn btn-ghost btn-sm" href="#/painel/estoque">Gerenciar</a></div>';
    return panelLayout('', c);
  }
  function todo(icn, t, href) { return '<a class="row" href="' + href + '" style="padding:10px 0;border-top:1px solid #EEF0F5;color:#1A1F2B">' + ic(icn) + '<span class="grow">' + t + '</span>' + ic('chevR', 'ico-sm') + '</a>'; }
  function vPedidosLojista() { return panelLayout('pedidos', '<div class="page-head"><h1>Pedidos</h1><div class="seg"><button aria-pressed="true">Todos</button><button aria-pressed="false">A separar</button><button aria-pressed="false">Concluídos</button></div></div><div class="banner-info blue">' + ic('info') + '<span class="small">Só pedidos com pagamento confirmado podem avançar. Cada loja avança a sua parte; a plataforma acompanha.</span></div>' + ordersTable(S.seller.pedidos)); }
  function vProdutosLojista() {
    var mine = PRODUCTS.filter(function (p) { return p.loja === S.seller.lojaId; });
    var c = '<div class="page-head"><h1>Produtos</h1><a class="btn btn-primary" href="#/painel/produtos/novo">' + ic('plus') + 'Novo produto</a></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Produto</th><th>Preço</th><th>Disponibilidade</th><th>Moderação</th><th></th></tr></thead><tbody>' + mine.map(function (p, i) {
        return '<tr><td><span class="row"><span class="thumb" style="width:44px;height:44px;background:' + cat(p.cat).tint + '"><svg viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-linecap="round"><path d="' + ICON[cat(p.cat).icon] + '"/></svg></span><span class="stack" style="--gap:0"><b style="font-weight:600">' + esc(p.nome) + '</b><span class="xs muted">' + cat(p.cat).nome + (p.var ? ' · ' + p.var.opcoes.length + ' variações' : '') + '</span></span></span></td><td>' + money(p.preco) + '</td><td><span class="status ' + DISP[p.disp][1] + '">' + DISP[p.disp][0] + '</span></td><td>' + (i === 1 ? '<span class="status st-amber">Alteração em análise</span>' : '<span class="status st-green">Publicado</span>') + '</td><td><button class="btn btn-sm btn-ghost" data-act="toast" data-msg="Editor do produto (demo).">' + ic('edit', 'ico-sm') + 'Editar</button></td></tr>';
      }).join('') + '</tbody></table></div><span class="small muted">Preço e estoque mudam na hora. Nome, fotos e descrição passam por moderação antes de aparecer.</span>';
    return panelLayout('produtos', c);
  }
  function vNovoProduto() {
    var c = '<div class="page-head"><h1>Novo produto</h1><a class="small" href="#/painel/produtos">Cancelar</a></div>' +
      '<form class="stack" data-form="produto" style="--gap:16px"><div class="card stack"><h2>Informações</h2><div class="field"><label for="np-nome">Nome do produto</label><input class="input" id="np-nome" required></div><div class="grid-2"><div class="field"><label for="np-cat">Categoria</label><select class="select" id="np-cat">' + CATS.map(function (c) { return '<option>' + c.nome + '</option>'; }).join('') + '</select></div><div class="field"><label for="np-tipo">Tipo</label><select class="select" id="np-tipo"><option>Simples</option><option>Com variações (tamanho, cor…)</option><option>Kit (2 ou mais produtos)</option><option>Digital (download)</option></select></div></div><div class="field"><label for="np-desc">Descrição</label><textarea class="textarea" id="np-desc"></textarea></div></div>' +
      '<div class="card stack"><h2>Fotos e vídeo</h2><div style="border:2px dashed #CDD6EA;border-radius:16px;padding:28px;text-align:center" class="stack"><span style="color:#1F4FA3;align-self:center">' + ic('upload', 'ico-lg') + '</span><b>Arraste as fotos ou clique para enviar</b><span class="small muted">Moda: 4:5 · demais categorias: 1:1 · vídeo 9:16 · ordem da galeria configurável</span></div></div>' +
      '<div class="card stack"><h2>Preço e estoque</h2><div class="grid-2"><div class="field"><label for="np-preco">Preço de venda (R$)</label><input class="input" id="np-preco" inputmode="decimal" data-act="pricecmp"><div class="banner-info blue" id="pricecmp" hidden>' + ic('info') + '<span class="small"></span></div></div><div class="field"><label for="np-de">Preço "de" (opcional)</label><input class="input" id="np-de" inputmode="decimal"></div><div class="field"><label for="np-sku">SKU</label><input class="input" id="np-sku"><span class="hint">Use o mesmo código do seu sistema para a API ligar o estoque.</span></div><div class="field"><label for="np-qtd">Estoque inicial</label><input class="input" id="np-qtd" inputmode="numeric"></div></div></div>' +
      '<div class="row"><a class="btn btn-ghost" href="#/painel/produtos">Cancelar</a><button class="btn btn-primary btn-lg grow" type="submit">Enviar para aprovação</button></div></form>';
    return panelLayout('produtos', c);
  }
  function vEstoque() {
    var sd = S.seller, api = sd.api;
    var rows = Object.keys(sd.estoque).map(function (pid) {
      var e = sd.estoque[pid], p = prod(pid), disp = e.saldo - api.reserva;
      var pub = disp <= 0 ? DISP.esgotado : disp <= e.minimo ? DISP.pouco : DISP.ok;
      return '<tr><td><b style="font-weight:600">' + esc(p.nome) + '</b><br><span class="xs muted">SKU ' + e.sku + '</span></td><td><b>' + e.saldo + '</b> un.</td><td>' + e.minimo + '</td><td><div class="bar"><i style="width:' + Math.min(100, Math.round(e.saldo / (e.minimo * 3) * 100)) + '%;background:' + (e.saldo <= e.minimo ? '#D7263D' : '#177A4E') + '"></i></div></td><td><span class="status ' + pub[1] + '">' + pub[0] + '</span></td><td><button class="btn btn-sm btn-ghost" data-act="toast" data-msg="Ajuste manual registrado no histórico.">Ajustar</button></td></tr>';
    }).join('');
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Estoque e integração</h1><span class="small muted">O comprador nunca vê o número: vê só Disponível, Últimas unidades ou Indisponível.</span></div></div>' +
      '<div class="card stack"><div class="row between wrap"><h2>Como seu estoque é atualizado</h2><div class="seg" role="group" aria-label="Modo de sincronização">' + [['manual', 'Manual'], ['planilha', 'Planilha'], ['api', 'API aberta']].map(function (m) { return '<button data-act="syncmode" data-v="' + m[0] + '" aria-pressed="' + (api.modo === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div></div>' +
      (api.modo === 'api' ? '<div class="banner-info green">' + ic('refresh') + '<span><b>Ligado ao sistema da loja física.</b> Última sincronização ' + api.ultimaSync + '. Vendas no balcão baixam o estoque aqui, e vendas aqui são avisadas ao seu sistema.</span></div>' : api.modo === 'planilha' ? '<div class="banner-info blue">' + ic('upload') + '<span>Envie um CSV com <span class="kbd">sku;quantidade</span>. Recomendado atualizar pelo menos 1 vez por dia.</span></div>' : '<div class="banner-info amber">' + ic('alert') + '<span>No modo manual, lembre de baixar aqui o que vender no balcão para não vender sem ter.</span></div>') +
      '<div class="row wrap" style="--gap:16px"><div class="field" style="max-width:280px"><label for="reserva">Reserva de segurança por produto</label><input class="input" id="reserva" type="number" min="0" value="' + api.reserva + '" data-act="reserva"><span class="hint">Unidades guardadas para o balcão. O marketplace só vende o que passar disso.</span></div></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Produto</th><th>Saldo</th><th>Mínimo</th><th>Nível</th><th>Comprador vê</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="card stack" id="api"><div class="row between wrap"><h2>API aberta de estoque</h2><a class="small" href="#/painel/estoque" data-act="toast" data-msg="Documentação completa (demo).">Documentação</a></div>' +
      '<div class="grid-2"><div class="field"><label>Chave da API</label><div class="row"><span class="kbd grow">' + api.chave + '</span><button class="btn btn-sm btn-ghost" data-act="toast" data-msg="Nova chave gerada. A anterior para de funcionar em 24 h.">' + ic('refresh', 'ico-sm') + 'Gerar nova</button></div><span class="hint">Mostrada por inteiro só uma vez, ao gerar.</span></div><div class="field"><label for="wh">Webhook de pedidos (seu sistema)</label><input class="input" id="wh" value="https://sua-loja.com.br/webhooks/cianorte-tem"><span class="hint">Avisamos <span class="kbd">pedido.pago</span> e <span class="kbd">pedido.cancelado</span>.</span></div></div>' +
      '<div class="code">' + esc('# Atualizar o saldo de um SKU\nPUT /v1/lojas/{lojaId}/estoque/{sku}\nAuthorization: Bearer <chave>\nIdempotency-Key: <uuid>\n{ "saldo": 42, "atualizadoEm": "2026-11-18T10:42:00-03:00" }\n\n# Atualizar vários de uma vez\nPOST /v1/lojas/{lojaId}/estoque/lote\n{ "itens": [ { "sku": "VA-CSL-001", "saldo": 42 }, { "sku": "VA-JJI-004", "saldo": 6 } ] }\n\n# Consultar o que está reservado por pedidos ainda não entregues\nGET /v1/lojas/{lojaId}/estoque/{sku}/reservas') + '</div></div>';
    return panelLayout('estoque', c);
  }
  function vMinhaLoja() {
    var sd = S.seller, st = store(sd.lojaId);
    var c = '<div class="page-head"><h1>Minha loja</h1><a class="btn btn-ghost" href="#/loja/' + st.id + '">' + ic('eye', 'ico-sm') + 'Ver vitrine</a></div>' +
      '<div class="card row wrap between"><span class="stack" style="--gap:2px"><b>Loja visível no marketplace</b><span class="small muted">' + (sd.status !== 'aprovada' ? 'Disponível depois da aprovação do cadastro.' : sd.visivel ? 'Seus produtos aparecem para compradores de ' + CITY.nome + '.' : 'Sua loja está oculta. Pedidos em andamento continuam normalmente.') + '</span></span><button class="switch" role="switch" aria-checked="' + sd.visivel + '" aria-label="Loja visível" data-act="visivel"' + (sd.status !== 'aprovada' ? ' disabled' : '') + '></button></div>' +
      '<div class="card stack"><h2>Entrega e retirada</h2><div class="grid-2"><div class="field"><label>Tarifa por km (R$)</label><input class="input" value="' + st.tarifaKm.toFixed(2).replace('.', ',') + '"><span class="hint">Frete = distância pelas ruas × tarifa.</span></div><div class="field"><label>Horário de corte</label><input class="input" value="15:00"><span class="hint">Pedidos pagos até o corte entram no prazo do dia. Mudar o corte não altera pedidos já feitos.</span></div></div>' +
      '<label class="check"><input type="checkbox" checked> Oferecer retirada na loja (só para compradores de ' + CITY.nome + ')</label></div>' +
      '<div class="card stack"><h2>Unidades</h2><div class="row between"><span>' + esc(st.nome) + ' — ' + esc(st.bairro) + '</span><span class="status st-green">Aprovada</span></div><button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-act="toast" data-msg="Cada nova unidade tem cadastro e aprovação próprios.">' + ic('plus', 'ico-sm') + 'Adicionar filial</button></div>';
    return panelLayout('loja', c);
  }
  function vCadastroLojista() {
    var sd = S.seller;
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Cadastro da loja</h1><span class="small muted">A aprovação libera a loja para vender. Dados protegidos e usados só para a operação.</span></div>' + '<span class="status ' + (sd.status === 'aprovada' ? 'st-green' : 'st-amber') + '">' + (sd.status === 'aprovada' ? 'Aprovada' : 'Em análise') + '</span></div>' +
      '<form class="stack" data-form="lojista" style="--gap:16px">' +
      '<div class="card stack"><h2>1. Empresa</h2><div class="grid-2"><div class="field"><label>CNPJ</label><input class="input" value="00.000.000/0001-00" required></div><div class="field"><label>Razão social</label><input class="input" value="[Razão social]"></div><div class="field"><label>Nome fantasia (aparece na vitrine)</label><input class="input" value="Confecções Vale Azul"></div><div class="field"><label>Inscrição estadual</label><input class="input" placeholder="Opcional"></div></div></div>' +
      '<div class="card stack"><h2>2. Responsável</h2><div class="grid-2"><div class="field"><label>Nome</label><input class="input" value="' + esc(sd.responsavel) + '"></div><div class="field"><label>CPF</label><input class="input"></div><div class="field"><label>E-mail</label><input class="input" type="email"></div><div class="field"><label>Celular</label><input class="input"></div></div></div>' +
      '<div class="card stack"><h2>3. Unidade (endereço físico)</h2><div class="grid-2"><div class="field"><label>CEP</label><input class="input" value="87200-000"></div><div class="field"><label>Bairro</label><input class="input" value="Zona 1"></div><div class="field"><label>Rua e número</label><input class="input"></div><div class="field"><label>Horário de funcionamento</label><input class="input" value="Seg a sáb, 8h às 18h"></div></div></div>' +
      '<div class="card stack"><h2>4. Recebimento</h2><div class="banner-info blue">' + ic('lock') + '<span class="small">Os dados bancários são cadastrados direto no provedor de pagamento, que faz a divisão (split) entre loja e plataforma.</span></div><button class="btn btn-ghost" type="button" style="align-self:flex-start" data-act="toast" data-msg="Conexão com o provedor de pagamento (a definir).">Conectar conta de recebimento</button></div>' +
      '<div class="card stack"><h2>5. Documentos</h2><div class="grid-2"><div class="radio-card on"><span class="grow">Cartão CNPJ</span><span class="status st-green">Enviado</span></div><div class="radio-card"><span class="grow">Contrato social e registro de marca <span class="xs muted">(para o selo Loja oficial)</span></span><button class="btn btn-sm btn-soft" type="button">Enviar</button></div></div></div>' +
      '<label class="check"><input type="checkbox" checked> Li e aceito o Contrato do Lojista e a Política de Privacidade.</label>' +
      '<button class="btn btn-primary btn-lg" type="submit">' + (sd.status === 'aprovada' ? 'Salvar alterações' : 'Enviar para aprovação') + '</button></form>';
    return panelLayout('cadastro', c);
  }

  /* ---------------- Central de anúncios ---------------- */
  var UNITS = { horas: { label: 'Horas', min: 6, max: 72, fator: function (s) { return s.precoDia * 0.08; } }, dias: { label: 'Dias', min: 1, max: 30, fator: function (s) { return s.precoDia; } }, semanas: { label: 'Semanas', min: 1, max: 4, fator: function (s) { return s.precoDia * 7; } }, mes: { label: '1 mês', min: 1, max: 1, fator: function (s) { return s.precoDia * 30; } } };
  function slotBtn(id, h, extra) {
    var s = slot(id);
    var lbl = { disponivel: 'Livre', leilao: 'Em lance', ocupado: 'Ocupada' }[s.status];
    return '<button class="slot ' + s.status + (S.adSel === id ? ' sel' : '') + '" style="height:' + h + 'px;' + (extra || '') + '" data-act="slot" data-v="' + id + '" aria-pressed="' + (S.adSel === id) + '" aria-label="Vaga ' + id + ': ' + s.nome + ', ' + lbl + '">' + id + ' · ' + lbl + '</button>';
  }
  function vAnuncios(q) {
    if (q.slot && slot(q.slot)) S.adSel = q.slot;
    var s = slot(S.adSel), u = UNITS[S.adUnit] || UNITS.dias;
    var qn = Math.min(Math.max(S.adQty, u.min), u.max);
    var tabela = u.fator(s) * qn;
    var minLance = s.status === 'leilao' ? s.lanceAtual + 2 : s.precoDia;
    var diasEquiv = S.adUnit === 'horas' ? qn / 24 : S.adUnit === 'dias' ? qn : S.adUnit === 'semanas' ? qn * 7 : 30;
    var map = '<div class="wire" aria-label="Mapa do site — home"><span class="w-label">Home</span><div class="w-bar"></div>' + slotBtn('H1', 86) + '<div class="w-row">' + [1, 2, 3, 4, 5].map(function () { return '<div class="w-cell" style="height:28px;border-radius:999px"></div>'; }).join('') + '</div><span class="w-label">Mais vendidos</span><div class="w-row"><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div></div>' + slotBtn('M1', 40) + '<span class="w-label">Melhores preços</span><div class="w-row">' + slotBtn('C1', 54, 'flex:1') + '<div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div></div><span class="w-label">Em alta</span><div class="w-row"><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div></div><div class="w-row">' + slotBtn('M2', 50, 'flex:1') + '</div><span class="w-label">Lojas</span><div class="w-row"><div class="w-cell" style="height:34px"></div><div class="w-cell" style="height:34px"></div></div>' +
      '<span class="w-label" style="margin-top:10px">Página de categoria</span><div class="w-bar"></div>' + slotBtn('K1', 44) + '<div class="w-row"><div style="flex:3;display:grid;grid-template-columns:repeat(3,1fr);gap:6px"><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div><div class="w-cell"></div></div>' + slotBtn('L1', 114, 'flex:1;width:auto') + '</div>' +
      '<div class="legend" style="margin-top:8px"><span><i style="border-color:#177A4E;background:#E6F3EC"></i>Livre</span><span><i style="border-color:#C98A00;background:#FFF4DE"></i>Em lance</span><span><i style="border-color:#A3AABA;background:#EEF0F5"></i>Ocupada</span></div></div>';
    var statusBox = s.status === 'leilao' ? '<div class="banner-info amber">' + ic('gavel') + '<span><b>Vaga em disputa.</b> Lance atual ' + money(s.lanceAtual) + '/dia · ' + s.lances + ' lances · encerra em ' + s.terminaEm + '. Quem der o maior lance por dia leva o período.</span></div>' :
      s.status === 'ocupado' ? '<div class="banner-info blue">' + ic('clock') + '<span><b>Ocupada até ' + s.ocupadoAte + '.</b> Dê um lance para o próximo período. Quem ocupa hoje tem preferência na renovação pelo mesmo valor até 48 h antes do fim.</span></div>' :
        '<div class="banner-info green">' + ic('check') + '<span><b>Vaga livre.</b> Contrate pelo valor de tabela agora, ou dê um lance maior para garantir prioridade na rotação.</span></div>';
    var detail = '<div class="card stack" style="--gap:16px"><div class="row between wrap"><div class="stack" style="--gap:2px"><span class="small muted">Vaga ' + s.id + ' · ' + (s.pagina === 'home' ? 'Página inicial' : 'Páginas de categoria') + '</span><h2>' + s.nome + '</h2><span class="small muted">' + s.posicao + '</span></div><span class="stack" style="--gap:0;text-align:right"><span class="xs muted">Tabela</span><span class="price-big" style="font-size:26px">' + money(s.precoDia) + '<span class="small muted" style="font-family:Inter;font-weight:500">/dia</span></span></span></div>' + statusBox +
      '<div class="stack" style="--gap:8px"><b>Formato do anúncio</b><div class="spec"><div><b>Desktop</b>' + s.formato.desktop + '</div><div><b>Celular</b>' + s.formato.mobile + '</div><div><b>Proporção</b>' + s.formato.proporcao + '</div><div><b>Arquivo</b>JPG, PNG ou WebP · até 500 KB</div><div><b>Área segura</b>Textos e logo a 40 px das bordas</div><div><b>Rotação</b>Até ' + s.rotacao + ' anunciantes revezando</div></div><span class="xs muted">Todo anúncio leva a marca "Patrocinado" e o nome da loja. Peças passam por aprovação (sem conteúdo enganoso, conforme CDC e CONAR).</span></div>' +
      '<div class="stack" style="--gap:10px"><b>Por quanto tempo?</b><div class="seg" role="group" aria-label="Unidade de tempo">' + Object.keys(UNITS).map(function (k) { return '<button data-act="adunit" data-v="' + k + '" aria-pressed="' + (S.adUnit === k) + '">' + UNITS[k].label + '</button>'; }).join('') + '</div>' +
      (S.adUnit !== 'mes' ? '<div class="row"><input class="range grow" type="range" min="' + u.min + '" max="' + u.max + '" value="' + qn + '" data-act="adqty" aria-label="Quantidade de ' + u.label.toLowerCase() + '"><b style="min-width:90px;text-align:right">' + qn + ' ' + u.label.toLowerCase() + '</b></div>' : '') +
      '<span class="xs muted">Mínimo 6 horas · máximo 30 dias por contratação. Depois disso a vaga volta para a disputa ou é renovada.</span></div>' +
      '<div class="card" style="background:#F6F7FA;border:0;display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:center"><span class="stack" style="--gap:2px"><span class="small muted">Valor de tabela para o período</span><span class="price-big">' + money(tabela) + '</span><span class="xs muted">≈ ' + diasEquiv.toFixed(diasEquiv < 1 ? 2 : 0).replace('.', ',') + ' dia(s) · valores de exemplo</span></span>' +
      (s.status === 'disponivel' ? '<button class="btn btn-primary btn-lg" data-act="contratar">' + ic('check') + 'Contratar por ' + money(tabela) + '</button>' : '') + '</div>' +
      '<form class="stack" data-form="lance" style="--gap:10px"><b>' + (s.status === 'disponivel' ? 'Ou dê um lance por dia' : 'Seu lance por dia') + '</b><div class="row wrap"><div class="field grow" style="max-width:240px"><label for="lance">Valor por dia (R$)</label><input class="input" id="lance" name="lance" inputmode="decimal" value="' + minLance.toFixed(2).replace('.', ',') + '"><span class="hint">Mínimo ' + money(minLance) + ' · incremento de R$ 2,00</span></div><button class="btn btn-dark btn-lg" type="submit">' + ic('gavel') + 'Dar lance</button></div></form>' +
      '<div class="stack" style="--gap:8px"><b>Peça do anúncio</b><div style="border:2px dashed #CDD6EA;border-radius:16px;padding:22px;text-align:center" class="stack"><span style="color:#1F4FA3;align-self:center">' + ic('upload', 'ico-lg') + '</span><b>Envie a arte no formato ' + s.formato.desktop + '</b><span class="small muted">Não tem arte? Use o modelo pronto com foto do produto, título e botão.</span></div></div></div>';
    var mine = S.seller.anuncios.concat(S.bookings);
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Anúncios</h1><span class="small muted">Escolha uma vaga no mapa do site, veja o formato e o valor, contrate ou dê um lance.</span></div></div>' +
      '<div class="adsmap"><div class="stack" style="--gap:12px">' + map + '</div>' + detail + '</div>' +
      '<div class="row between"><h2>Minhas campanhas</h2></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Vaga</th><th>Período</th><th>Valor/dia</th><th>Situação</th></tr></thead><tbody>' + mine.map(function (a) { return '<tr><td><b>' + a.slot + '</b> · ' + slot(a.slot).nome + '</td><td>' + a.periodo + '</td><td>' + money(a.valor) + '</td><td><span class="status ' + (/vencendo|análise/i.test(a.status) ? 'st-amber' : 'st-green') + '">' + a.status + '</span></td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="card stack"><h2>Regras da publicidade</h2><span class="small muted">• Cada vaga reveza um número limitado de anunciantes (veja "Rotação"). • Contratação mínima de 6 horas e máxima de 30 dias; depois, renova ou libera. • Em disputa, ganha o maior lance por dia; empate fica com quem deu o lance primeiro. • O pagamento é cobrado só se o lance vencer. • Anúncio reprovado na moderação é reembolsado. • Valores desta tela são exemplos até a tabela oficial ser aprovada.</span></div>';
    return panelLayout('anuncios', c);
  }

  function vFinanceiro() {
    var pg = S.seller.pedidos.filter(function (o) { return o.status !== 'cancelado'; });
    var bruto = pg.reduce(function (a, o) { return a + o.total; }, 0), com = bruto * 0.10, taxa = bruto * 0.02, liq = bruto - com - taxa;
    var concl = pg.filter(function (o) { return o.status === 'entregue' || o.status === 'retirado'; }).reduce(function (a, o) { return a + o.total * 0.88; }, 0);
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Financeiro</h1><span class="small muted">Novembro · valores ilustrativos (comissão 10% sobre produtos e taxa de pagamento 2% — percentuais a definir)</span></div><div class="seg"><button aria-pressed="true">Este mês</button><button aria-pressed="false">Mês anterior</button></div></div>' +
      '<div class="kpis"><div class="kpi"><span class="small muted">Vendas</span><span class="v">' + money(bruto) + '</span></div><div class="kpi"><span class="small muted">Comissão da plataforma</span><span class="v">− ' + money(com) + '</span></div><div class="kpi"><span class="small muted">Taxa de pagamento</span><span class="v">− ' + money(taxa) + '</span></div><div class="kpi dark"><span class="small">Líquido para a loja</span><span class="v">' + money(liq) + '</span></div></div>' +
      '<div class="grid-2"><div class="card stack" style="--gap:4px"><span class="small muted">Disponível para saque</span><span class="price-big" style="font-size:28px">' + money(concl) + '</span><span class="xs muted">Pedidos concluídos. Prazos reais de repasse dependem do provedor de pagamento.</span></div><div class="card stack" style="--gap:4px"><span class="small muted">A liberar</span><span class="price-big" style="font-size:28px">' + money(Math.max(0, liq - concl)) + '</span><span class="xs muted">Pedidos pagos ainda não entregues ou retirados.</span></div></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Quando</th><th>Venda</th><th>Comissão</th><th>Taxa</th><th>Líquido</th><th>Situação</th></tr></thead><tbody>' + pg.map(function (o) { return '<tr><td><b>' + o.id + '</b></td><td>' + o.quando + '</td><td>' + money(o.total) + '</td><td>− ' + money(o.total * 0.1) + '</td><td>− ' + money(o.total * 0.02) + '</td><td><b>' + money(o.total * 0.88) + '</b></td><td>' + pStatusPill(o.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<span class="small muted">O frete pertence à loja e não paga comissão. Estornos e devoluções aparecem aqui como lançamentos negativos.</span>';
    return panelLayout('financeiro', c);
  }
  function vVitrineLoja() {
    var st = store(S.seller.lojaId), ok = !!st.selo, v = S.seller.vitrine;
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Vitrine da loja</h1><span class="small muted">Monte a página da sua loja com módulos prontos. Sem código: nada de HTML, CSS ou JavaScript.</span></div><a class="btn btn-ghost" href="#/loja/' + st.id + '">' + ic('eye', 'ico-sm') + 'Ver loja</a></div>' +
      (ok ? '<div class="banner-info green">' + ic('shield') + '<span>Disponível porque sua loja é <b>' + (st.selo === 'oficial' ? 'Oficial' : 'Indicada') + '</b>. Se perder o selo, a página volta ao modelo padrão (os módulos ficam guardados).</span></div>' : '<div class="banner-info amber">' + ic('lock') + '<span>A vitrine personalizada é exclusiva de lojas Oficiais e Indicadas.</span></div>') +
      '<div class="card stack" style="--gap:0">' + v.map(function (m, i) {
        return '<div class="row" style="padding:12px 0;border-top:' + (i ? '1px solid #EEF0F5' : '0') + '"><span class="store-logo" style="width:36px;height:36px;font-size:13px;border-radius:10px;background:#EEF2FA;color:#1F4FA3">' + (i + 1) + '</span><span class="grow stack" style="--gap:0"><b style="font-size:14px">' + esc(m.tipo) + '</b><span class="xs muted">' + esc(m.det) + '</span></span>' +
          '<button class="icon-btn" style="color:#14213D" data-act="vmove" data-i="' + i + '" data-d="-1" aria-label="Subir"' + (i === 0 ? ' disabled' : '') + '>' + svgRot('chevD', 180) + '</button><button class="icon-btn" style="color:#14213D" data-act="vmove" data-i="' + i + '" data-d="1" aria-label="Descer"' + (i === v.length - 1 ? ' disabled' : '') + '>' + ic('chevD') + '</button><button class="icon-btn" style="color:#A61B2E" data-act="vrm" data-i="' + i + '" aria-label="Remover">' + ic('trash') + '</button></div>';
      }).join('') + '</div>' +
      '<div class="card row wrap"><label class="sr" for="vadd-sel">Tipo de módulo</label><select class="select" id="vadd-sel" style="max-width:320px"><option>Banner horizontal</option><option>Mosaico</option><option>Produtos em carrossel</option><option>Produtos em grade</option><option>Categorias da loja</option><option>Vídeo vertical</option></select><button class="btn btn-primary" data-act="vadd"' + (ok ? '' : ' disabled') + '>' + ic('plus', 'ico-sm') + 'Adicionar módulo</button></div>' +
      '<span class="small muted">Imagens e vídeos dos módulos passam por moderação. A home geral do ' + CITY.marca + ' é controlada pela plataforma; espaços nela são vendidos em Anúncios.</span>';
    return panelLayout('vitrine', c);
  }
  function svgRot(n, deg) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + deg + 'deg)"><path d="' + ICON[n] + '"/></svg>'; }
  function vEquipe() {
    var all = ['Pedidos', 'Produtos', 'Estoque', 'Financeiro', 'Anúncios', 'Equipe'];
    var c = '<div class="page-head"><div class="stack" style="--gap:2px"><h1>Equipe</h1><span class="small muted">Cada pessoa entra com o próprio login e vê só o que você liberar.</span></div><button class="btn btn-primary" data-act="toast" data-msg="Convite enviado por e-mail (demo).">' + ic('plus', 'ico-sm') + 'Convidar pessoa</button></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Pessoa</th><th>Papel</th>' + all.map(function (a) { return '<th>' + a + '</th>'; }).join('') + '</tr></thead><tbody>' + S.seller.equipe.map(function (m) {
        return '<tr><td><b>' + esc(m.nome) + '</b><br><span class="xs muted">' + esc(m.email) + '</span></td><td>' + esc(m.papel) + '</td>' + all.map(function (a) { return '<td><input type="checkbox" aria-label="' + a + ' para ' + esc(m.nome) + '"' + (m.perms.indexOf(a) >= 0 ? ' checked' : '') + (m.papel === 'Responsável' ? ' disabled' : '') + ' style="width:18px;height:18px;accent-color:#1F4FA3"></td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><span class="small muted">Toda ação sensível (preço, estoque, repasse, equipe) fica registrada com autor e data.</span>';
    return panelLayout('equipe', c);
  }
  function emptyBox(icn, t, d, cta) { return '<div class="empty"><span class="ic">' + ic(icn, 'ico-lg') + '</span><h2>' + t + '</h2><span>' + d + '</span>' + (cta || '') + '</div>'; }
  function vNotFound() { return shopLayout(emptyBox('search', 'Página não encontrada', 'O endereço pode ter mudado.', '<a class="btn btn-primary" href="#/">Voltar ao início</a>'), 'home'); }

  /* ---------------- Sheets (CEP e categorias) ---------------- */
  var sheet = null;
  function drawerHtml() {
    var t = totals();
    var body = !S.cart.length ? '<span class="muted">Sua sacola está vazia.</span>' : t.groups.map(function (g) {
      return '<div class="stack" style="--gap:8px;padding:12px 0;border-top:1px solid #E3E1DA"><b class="small">' + esc(g.st.nome) + '</b>' + freteGratisInfo(g.st) + g.linhas.map(function (l) {
        return '<div class="row"><span class="thumb" style="width:52px;height:52px;background:' + cat(l.p.cat).tint + '"><svg viewBox="0 0 24 24" fill="none" stroke="#14213D" stroke-linecap="round" stroke-linejoin="round"><path d="' + ICON[cat(l.p.cat).icon] + '"/></svg></span><span class="grow stack" style="--gap:0"><span class="small">' + esc(l.p.nome) + '</span><span class="xs muted">' + l.item.qty + ' × ' + money(l.p.preco) + (l.item.v ? ' · ' + esc(l.item.v) : '') + '</span></span></div>';
      }).join('') + '</div>';
    }).join('');
    return '<div class="drawer-bg" data-act="closesheet"><aside class="drawer" role="dialog" aria-label="Sacola" data-stop><div class="row between"><h2>' + ic('bag') + ' Sacola</h2><button class="icon-btn" data-act="closesheet" aria-label="Fechar" style="color:#14213D">' + ic('x') + '</button></div>' +
      (S.lastAdded ? '<div class="banner-info green">' + ic('check') + '<span>Adicionado: <b>' + esc(S.lastAdded) + '</b></span></div>' : '') +
      '<div class="grow" style="overflow-y:auto">' + body + '</div>' +
      '<div class="stack" style="--gap:10px;border-top:1px solid #E3E1DA;padding-top:14px"><div class="summary-total"><span>Subtotal</span><span>' + money(t.sub) + '</span></div><a class="btn btn-primary btn-lg" href="' + (S.user ? '#/checkout' : '#/entrar?next=checkout') + '" data-act="closesheet">Fechar compra</a><a class="btn btn-ghost" href="#/sacola" data-act="closesheet">Ver sacola completa</a></div></aside></div>';
  }
  function sheetHtml() {
    if (sheet === 'cart') return drawerHtml();
    if (sheet === 'local') return '<div class="sheet-bg" data-act="closesheet"><div class="sheet" role="dialog" aria-label="Onde você quer receber?" data-stop><span class="grab"></span><div class="row between"><h2>Onde você quer receber?</h2><button class="icon-btn" data-act="closesheet" aria-label="Fechar" style="color:#14213D">' + ic('x') + '</button></div><span class="muted small">Confirme a cidade e o CEP da sua rua para ver as lojas e os produtos que entregam ou podem ser retirados perto de você. Você pode navegar mesmo sem informar.</span><form class="stack" data-form="cep"><div class="field"><label for="city-in">Cidade</label><select class="select" id="city-in" name="cidade"><option>' + CITY.nome + '/' + CITY.uf + '</option><option>Outra cidade</option></select></div><div class="field"><label for="cep-in">CEP da sua rua</label><input class="input" id="cep-in" name="cep" value="" inputmode="numeric" placeholder="00000-000"></div><button class="btn btn-primary btn-lg" type="submit">Confirmar localização</button><span class="xs muted">Guardamos essa escolha neste aparelho. No cadastro, é só completar o endereço.</span></form></div></div>';
    if (sheet === 'cep') return '<div class="sheet-bg" data-act="closesheet"><div class="sheet" role="dialog" aria-label="Alterar CEP" data-stop><span class="grab"></span><div class="row between"><h2>Onde você está?</h2><button class="icon-btn" data-act="closesheet" aria-label="Fechar">' + ic('x') + '</button></div><span class="muted small">Mostramos as ofertas que entregam ou podem ser retiradas no seu endereço.</span><form class="row" data-form="cep"><label class="sr" for="cep-in">CEP</label><input class="input grow" id="cep-in" name="cep" value="' + esc(S.cep) + '" inputmode="numeric" placeholder="00000-000"><button class="btn btn-primary" type="submit">Usar</button></form><span class="xs muted">Atendemos CEPs de ' + CITY.nome + ' (872xx-xxx). Teste com 86000-000 para ver o aviso de fora da área.</span></div></div>';
    if (sheet === 'cats') return '<div class="sheet-bg" data-act="closesheet"><div class="sheet" role="dialog" aria-label="Categorias" data-stop><span class="grab"></span><div class="row between"><h2>Categorias</h2><button class="icon-btn" data-act="closesheet" aria-label="Fechar">' + ic('x') + '</button></div><div class="mega">' + CATS.map(function (c) { return '<a href="#/c/' + c.id + '" data-act="closesheet"><span class="ic">' + ic(c.icon) + '</span>' + c.nome + '</a>'; }).join('') + '</div></div></div>';
    return '';
  }

  /* ---------------- Roteador ---------------- */
  function parse() {
    var h = (location.hash || '#/').slice(1), qi = h.indexOf('?'), path = qi >= 0 ? h.slice(0, qi) : h, qs = qi >= 0 ? h.slice(qi + 1) : '', q = {};
    qs.split('&').forEach(function (kv) { if (!kv) return; var p = kv.split('='); q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return { parts: path.split('/').filter(Boolean), q: q };
  }
  function route() {
    var r = parse(), p = r.parts, q = r.q;
    switch (p[0]) {
      case undefined: return vHome();
      case 'categorias': return vCategorias();
      case 'c': return vCategoria(p[1], q);
      case 'ofertas': return vOfertas(q);
      case 'busca': return vBusca(q);
      case 'lojas': return vLojas();
      case 'loja': return vLoja(p[1]);
      case 'p': return vProduto(p[1]);
      case 'sacola': return vSacola();
      case 'checkout': return vCheckout();
      case 'pedido': return vPedido(p[1]);
      case 'entrar': return vEntrar(q);
      case 'cadastro': return vCadastro(q);
      case 'conta': return vConta(p[1]);
      case 'termos': return vLegal('termos');
      case 'privacidade': return vLegal('privacidade');
      case 'vender': return vVender();
      case 'painel':
        if (!p[1]) return vPainel();
        if (p[1] === 'pedidos') return vPedidosLojista();
        if (p[1] === 'produtos') return p[2] === 'novo' ? vNovoProduto() : vProdutosLojista();
        if (p[1] === 'estoque') return vEstoque();
        if (p[1] === 'anuncios') return vAnuncios(q);
        if (p[1] === 'loja') return vMinhaLoja();
        if (p[1] === 'cadastro') return vCadastroLojista();
        if (p[1] === 'financeiro') return vFinanceiro();
        if (p[1] === 'vitrine') return vVitrineLoja();
        if (p[1] === 'equipe') return vEquipe();
        return vPainel();
      default: return vNotFound();
    }
  }
  window.CT_ROUTE = route; // usado pelo teste de fumaça
  window.CT_STATE = function () { return S; };

  /* ---------------- Render e eventos (só no navegador) ---------------- */
  if (typeof document === 'undefined') return;
  var app = document.getElementById('app'), lastHash = null, toastT = null;
  document.documentElement.style.setProperty('--acento', CITY.acento);
  document.title = CITY.marca;
  function render() {
    var hp = parse().parts[0];
    if (!S.cepOk && !sheet && hp !== 'painel' && hp !== 'termos' && hp !== 'privacidade') sheet = 'local';
    var out = route();
    document.body.className = out.cls || '';
    app.innerHTML = out.html + sheetHtml();
    if (location.hash !== lastHash) { window.scrollTo(0, 0); lastHash = location.hash; }
    var hero = document.getElementById('hero');
    if (hero) hero.addEventListener('scroll', function () { var i = Math.round(hero.scrollLeft / hero.clientWidth); document.querySelectorAll('.hero-dots span').forEach(function (d, k) { d.className = k === i ? 'on' : ''; }); }, { passive: true });
  }
  function toast(msg) {
    var t = document.querySelector('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = ic('check') + '<span>' + esc(msg) + '</span>';
    document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(function () { t.remove(); }, 2800);
  }
  function addToCart(id, go) {
    var p = prod(id), v = S.pdpVar && S.pdpVar.id === id ? S.pdpVar.v : null, n = S.pdpQty && S.pdpQty.id === id ? S.pdpQty.n : 1;
    if (p.var && !v) { toast('Escolha ' + p.var.nome.toLowerCase() + ' antes de adicionar.'); return; }
    var k = id + '|' + (v || ''), ex = S.cart.find(function (i) { return i.k === k; });
    if (ex) ex.qty += n; else S.cart.push({ k: k, id: id, v: v, qty: n });
    save();
    S.lastAdded = p.nome + (v ? ' (' + v + ')' : ''); save();
    if (go) location.hash = '#/sacola'; else { sheet = 'cart'; render(); }
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]'); if (!el) return;
    var a = el.getAttribute('data-act'), d = el.dataset;
    if (a === 'closesheet') { if (e.target.closest('[data-stop]') && (el.classList.contains('sheet-bg') || el.classList.contains('drawer-bg'))) return; if (sheet === 'local') { S.cepOk = true; save(); } sheet = null; if (el.tagName !== 'A') { e.preventDefault(); } render(); return; }
    if (['fav', 'add', 'buy', 'var', 'qtypdp', 'qty', 'rm', 'cep', 'cats', 'cookies', 'step', 'finalizar', 'pagar', 'toast', 'logout', 'priv', 'visivel', 'aprovar', 'avancar', 'syncmode', 'slot', 'adunit', 'contratar', 'rail', 'qadd', 'vmove', 'vrm', 'vadd', 'opencart'].indexOf(a) >= 0) e.preventDefault();
    switch (a) {
      case 'fav': var i = S.favs.indexOf(d.id); if (i >= 0) S.favs.splice(i, 1); else S.favs.push(d.id); save(); render(); toast(i >= 0 ? 'Removido dos favoritos.' : 'Salvo nos favoritos.'); break;
      case 'add': addToCart(d.id, false); break;
      case 'qadd': var qp = prod(d.id); if (qp.var) { location.hash = '#/p/' + qp.id; setTimeout(function () { toast('Escolha ' + qp.var.nome.toLowerCase() + ' para adicionar.'); }, 50); } else { S.pdpQty = null; addToCart(d.id, false); } break;
      case 'opencart': sheet = 'cart'; S.lastAdded = null; render(); break;
      case 'vmove': var vi = +d.i, vj = vi + (+d.d), vv = S.seller.vitrine; if (vj >= 0 && vj < vv.length) { var tmp = vv[vi]; vv[vi] = vv[vj]; vv[vj] = tmp; save(); render(); } break;
      case 'vrm': S.seller.vitrine.splice(+d.i, 1); save(); render(); toast('Módulo removido.'); break;
      case 'vadd': var sel = document.getElementById('vadd-sel'); S.seller.vitrine.push({ tipo: sel.value, det: 'Configure o conteúdo' }); save(); render(); toast('Módulo adicionado ao fim da vitrine.'); break;
      case 'buy': addToCart(d.id, true); break;
      case 'var': S.pdpVar = { id: d.id, v: d.v }; render(); break;
      case 'qtypdp': var cur = S.pdpQty && S.pdpQty.id === d.id ? S.pdpQty.n : 1; S.pdpQty = { id: d.id, n: Math.max(1, Math.min(10, cur + (+d.d))) }; render(); break;
      case 'qty': var it = S.cart.find(function (x) { return x.k === d.k; }); if (it) { it.qty = Math.max(1, Math.min(10, it.qty + (+d.d))); save(); render(); } break;
      case 'rm': S.cart = S.cart.filter(function (x) { return x.k !== d.k; }); save(); render(); toast('Item removido.'); break;
      case 'cep': sheet = 'cep'; render(); setTimeout(function () { var f = document.getElementById('cep-in'); if (f) f.focus(); }, 30); break;
      case 'cats': sheet = 'cats'; render(); break;
      case 'cookies': S.cookies = d.v; save(); render(); break;
      case 'step': S.checkout.step = d.v; save(); render(); window.scrollTo(0, 0); break;
      case 'finalizar':
        var t = totals(), id = String(10500 + S.orders.length + 1);
        var o = { id: id, data: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }), total: t.total, pagamento: S.checkout.pagamento, pago: false, sub: t.groups.map(function (g, k) { return { loja: g.st.id, letra: 'ABCDEFGH'[k], modo: S.checkout.modos[g.st.id] || 'entrega' }; }) };
        S.orders.unshift(o); S.cart = []; S.checkout = { step: 'entrega', modos: {}, pagamento: 'pix' }; save(); location.hash = '#/pedido/' + id; break;
      case 'pagar': var oo = S.orders.find(function (x) { return x.id === d.id; }); if (oo) { oo.pago = true; save(); render(); toast('Pagamento confirmado.'); } break;
      case 'toast': toast(d.msg); break;
      case 'logout': S.user = null; save(); location.hash = '#/'; toast('Você saiu da conta.'); break;
      case 'priv': if (d.k === 'marketing') { S.user.marketing = !S.user.marketing; } else { S.cookies = S.cookies === 'todos' ? 'necessarios' : 'todos'; } save(); render(); toast('Preferência atualizada.'); break;
      case 'visivel': if (S.seller.status !== 'aprovada') { toast('A loja só pode ficar visível depois da aprovação.'); break; } S.seller.visivel = !S.seller.visivel; save(); render(); toast(S.seller.visivel ? 'Loja visível no marketplace.' : 'Loja oculta.'); break;
      case 'aprovar': S.seller.status = 'aprovada'; save(); render(); toast('Cadastro aprovado (simulação).'); break;
      case 'avancar': var po = S.seller.pedidos.find(function (x) { return x.id === d.id; }); var nx = po && nextStatus(po); if (nx) { po.status = nx; save(); render(); toast('Pedido ' + po.id + ': ' + OST[nx] + '.'); } break;
      case 'syncmode': S.seller.api.modo = d.v; save(); render(); break;
      case 'slot': S.adSel = d.v; save(); render(); break;
      case 'adunit': S.adUnit = d.v; var u = UNITS[d.v]; S.adQty = Math.min(Math.max(S.adQty, u.min), u.max); save(); render(); break;
      case 'contratar': var s = slot(S.adSel); S.bookings.unshift({ slot: s.id, status: 'Arte em análise', valor: s.precoDia, periodo: 'A partir da aprovação' }); save(); render(); toast('Vaga ' + s.id + ' reservada. Envie a arte para aprovação.'); break;
      case 'rail': var r = document.getElementById(d.target); if (r) r.scrollBy({ left: (+d.dir) * r.clientWidth * 0.9, behavior: 'smooth' }); break;
    }
  });
  document.addEventListener('change', function (e) {
    var el = e.target, a = el.getAttribute('data-act'); if (!a) return;
    if (a === 'modo') { S.checkout.modos[el.dataset.st] = el.dataset.v; save(); render(); }
    if (a === 'pg') { S.checkout.pagamento = el.dataset.v; save(); render(); }
    if (a === 'reserva') { S.seller.api.reserva = Math.max(0, +el.value || 0); save(); render(); }
    if (a === 'adqty') { S.adQty = +el.value; save(); render(); }
  });
  document.addEventListener('input', function (e) { if (e.target.getAttribute('data-act') === 'pricecmp') { var bx = document.getElementById('pricecmp'), val = parseFloat(String(e.target.value).replace(',', '.')); if (!(val > 0)) { bx.hidden = true; return; } var ref = [84.9, 99.9], txt = val < ref[0] ? 'abaixo' : val > ref[1] ? 'acima' : 'dentro da faixa'; bx.hidden = false; bx.querySelector('span').innerHTML = 'Seu preço está <b>' + txt + '</b> de 2 ofertas equivalentes no marketplace (' + money(ref[0]) + ' a ' + money(ref[1]) + ', sem frete). Aviso informativo: você decide o preço. <i>(demo)</i>'; return; } if (e.target.getAttribute('data-act') === 'adqty') { var b = e.target.parentNode.querySelector('b'); if (b) b.textContent = e.target.value + ' ' + UNITS[S.adUnit].label.toLowerCase(); } });
  document.addEventListener('submit', function (e) {
    var f = e.target, k = f.getAttribute('data-form'); if (!k) return; e.preventDefault();
    var fd = new FormData(f), v = {}; fd.forEach(function (val, key) { v[key] = val; });
    if (k === 'search') { location.hash = '#/busca?q=' + encodeURIComponent(v.q || ''); }
    else if (k === 'cep') { var c = (v.cep || '').replace(/\D/g, ''); if (c.length !== 8) { toast('Digite um CEP com 8 números.'); return; } S.cep = c.slice(0, 5) + '-' + c.slice(5); S.cepOk = true; sheet = null; save(); render(); toast(cepNaCidade() ? 'Mostrando ofertas para ' + S.cep + '.' : 'CEP fora da área atendida. Algumas ofertas ficam indisponíveis.'); }
    else if (k === 'login') { S.user = S.user || { nome: 'Comprador Demonstração', email: v.email, cpf: '', celular: '', marketing: false }; save(); location.hash = f.dataset.next === 'checkout' ? '#/checkout' : '#/conta'; toast('Bem-vindo!'); }
    else if (k === 'cadastro') { var ok = v.nome && v.cpf && v.email && v.senha && v.senha.length >= 8 && v.celular && v.termos && v.idade; var err = f.querySelector('[data-err]'); if (!ok) { err.hidden = false; return; } S.user = { nome: v.nome, email: v.email, cpf: v.cpf, celular: v.celular, marketing: !!v.marketing, consentimentoEm: new Date().toISOString() }; save(); location.hash = f.dataset.next === 'checkout' ? '#/checkout' : '#/conta'; toast('Conta criada.'); }
    else if (k === 'endereco') { }
    else if (k === 'produto') { toast('Produto enviado para moderação.'); location.hash = '#/painel/produtos'; }
    else if (k === 'lojista') { if (S.seller.status !== 'aprovada') S.seller.status = 'em_analise'; save(); toast('Cadastro enviado. Prazo de análise: até 2 dias úteis.'); location.hash = '#/painel'; }
    else if (k === 'lance') { var s = slot(S.adSel), val = parseFloat(String(v.lance).replace(/\./g, '').replace(',', '.')), min = s.status === 'leilao' ? s.lanceAtual + 2 : s.precoDia; if (!(val >= min)) { toast('O lance mínimo é ' + money(min) + ' por dia.'); return; } if (s.status === 'leilao') { s.lanceAtual = val; s.lances++; } S.bookings.unshift({ slot: s.id, status: 'Lance vencendo', valor: val, periodo: s.status === 'ocupado' ? 'A partir de ' + s.ocupadoAte : 'Próximo período' }); save(); render(); toast('Lance de ' + money(val) + '/dia registrado.'); }
  });
  // salva o endereço do checkout ao sair do campo
  document.addEventListener('focusout', function (e) { var f = e.target.form; if (f && f.getAttribute('data-form') === 'endereco' && S.user) { var fd = new FormData(f), v = {}; fd.forEach(function (val, key) { v[key] = val; }); S.user.endereco = v; if (v.cep) S.cep = v.cep; save(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet) { sheet = null; render(); } });
  window.addEventListener('hashchange', function () { sheet = null; render(); });
  render();
  if ('serviceWorker' in navigator && location.protocol === 'https:' ) { try { navigator.serviceWorker.register('sw.js').catch(function () { }); } catch (e) { } }
})();
