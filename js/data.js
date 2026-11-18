/* =========================================================================
   Cianorte Tem — dados de demonstração (mock)
   Tudo aqui é fictício e será substituído pela API do back-end.
   Contratos esperados estão descritos no CLAUDE.md (seção "Contratos de API").
   ========================================================================= */

/* ---------- White label: configuração da cidade ----------
   Trocar este objeto (vindo do back-end por domínio/subdomínio) é o que
   transforma "Cianorte Tem" em "Maringá Tem", "Campo Mourão Tem" etc. */
window.CITY = {
  slug: 'cianorte',
  nome: 'Cianorte',
  marca: 'Cianorte Tem',
  uf: 'PR',
  cepPadrao: '87200-000',
  acento: '#D7263D',            // cor da etiqueta "Tem" (vem da bandeira da cidade)
  associacao: 'ACIC',            // associação comercial parceira (texto de exemplo)
  slogan: 'Tudo o que a cidade tem, num lugar só.',
  cepsAtendidos: ['87200', '87201', '87202', '87203', '87204', '87205', '87206', '87207', '87208', '87209']
};

/* ---------- Ícones de linha (Lucide-like) — paths ---------- */
window.ICON = {
  search: 'M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM20 20l-3.5-3.5',
  bag: 'M6 7h12l-1 13H7L6 7zM9 7a3 3 0 0 1 6 0',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 21c.8-4 4-6 8-6s7.2 2 8 6',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  pin: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 6.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  chevR: 'm9 6 6 6-6 6', chevL: 'm15 6-6 6 6 6', chevD: 'm6 9 6 6 6-6',
  x: 'M6 6l12 12M18 6 6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM17 19a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  store: 'M4 9l1.5-5h13L20 9M4 9h16v11H4zM9 20v-6h6v6M4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3',
  shield: 'M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4',
  lock: 'M6.5 10.5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 10.5V7.5a4 4 0 0 1 8 0v3',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z',
  fire: 'M12 21c-3.9 0-7-2.8-7-6.5 0-3 2-5 3.5-6.5.3 1.6 1.2 2.8 2.5 3.3C11 7.5 12.5 5 15 3c-.3 3 1 4.6 2.5 6.3 1 1.2 1.5 2.7 1.5 4.2 0 4.1-3.1 7.5-7 7.5z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  pix: 'M12 3 21 12 12 21 3 12zM8.5 12h7',
  card: 'M5 5h14a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 19 19H5a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 5 5zM2.5 10h19M6 15h4',
  box: 'M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5 12 12l9-4.5M12 12v9',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  megaphone: 'M3 10v4l11 5V5L3 10zM14 8h3a4 4 0 0 1 0 8h-3M6 15l1 5h3l-1-4',
  settings: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 4v4h4M4 13a8 8 0 0 0 14.9 3M20 20v-4h-4',
  eye: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  logout: 'M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
  gavel: 'M14 4l6 6M11 7l6 6M8.5 9.5l6 6M12.5 5.5l-6 6M3 21l7-7',
  info: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 11v5M12 8h.01',
  alert: 'M12 3.5 21.5 20h-19zM12 10v4.5M12 17.5v.01',
  doc: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  copy: 'M9 9h10v12H9zM5 15V3h10',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  filter: 'M4 5h16l-6 7.5V19l-4 1.5v-8z',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  medal: 'M8 3h8l-2 6h-4zM12 9a6 6 0 1 1 0 12 6 6 0 0 1 0-12zM12 13l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L9 15.3l2-.3z',
  // ícones de categoria
  shirt: 'M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3c0 1.7-1.3 3-3 3S8 4.7 8 3z',
  hammer: 'M14 4l6 6-2 2-6-6zM12 6 3 15l3 3 9-9',
  bed: 'M3 18V8M3 14h18v4M21 18v-4a3 3 0 0 0-3-3H9v3M6 11.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z',
  sofa: 'M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h4v4h10v-4h4v7H3zM5 18v2M19 18v2',
  cart: 'M3 4h2l2.5 11h10L20 8H6.5M9 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM17 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  phone: 'M8 2.5h8a1.5 1.5 0 0 1 1.5 1.5v16a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V4A1.5 1.5 0 0 1 8 2.5zM11 18h2',
  ball: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zM12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M16 10l4.5-1.5M14.5 14.5 17 19M9.5 14.5 7 19M8 10 3.5 8.5',
  drop: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
  baby: 'M12 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM9.5 10h.01M14.5 10h.01M10 13.5c1.2 1 2.8 1 4 0M12 4c0 1.5 1 2.5 2 2.5',
  paw: 'M7 10a1.8 1.8 0 1 1 0-3.6A1.8 1.8 0 0 1 7 10zM17 10a1.8 1.8 0 1 1 0-3.6A1.8 1.8 0 0 1 17 10zM10 6.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM14 6.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zM12 12c-3 0-5 3-5 5a2.5 2.5 0 0 0 3.5 2.3c1-.4 2-.4 3 0A2.5 2.5 0 0 0 17 17c0-2-2-5-5-5z'
};

/* ---------- Categorias ---------- */
window.CATEGORIES = [
  { id: 'moda', nome: 'Moda e vestuário', icon: 'shirt', tint: '#EAF0FA', destaque: 'A capital do vestuário direto da fábrica' },
  { id: 'construcao', nome: 'Casa e construção', icon: 'hammer', tint: '#F1EEE6', destaque: 'Material, ferramenta e acabamento sem sair de casa' },
  { id: 'cama-mesa-banho', nome: 'Cama, mesa e banho', icon: 'bed', tint: '#F4EEF0', destaque: 'Enxoval feito aqui, entregue aqui' },
  { id: 'moveis', nome: 'Móveis e decoração', icon: 'sofa', tint: '#EFEDE8', destaque: 'Para cada canto da casa' },
  { id: 'mercado', nome: 'Mercado', icon: 'cart', tint: '#EAF4EE', destaque: 'Compras do mês com entrega no mesmo dia' },
  { id: 'eletronicos', nome: 'Celulares e eletrônicos', icon: 'phone', tint: '#ECEEF3', destaque: 'Tecnologia com garantia de loja da cidade' },
  { id: 'esporte', nome: 'Esporte e lazer', icon: 'ball', tint: '#EAF3F1', destaque: 'Para jogar, treinar e torcer' },
  { id: 'beleza', nome: 'Beleza e saúde', icon: 'drop', tint: '#F5EEEC', destaque: 'Cuidado pessoal das lojas do bairro' },
  { id: 'infantil', nome: 'Infantil', icon: 'baby', tint: '#EEF1F8', destaque: 'Roupa, brinquedo e enxoval de bebê' },
  { id: 'pet', nome: 'Pet', icon: 'paw', tint: '#F2F0E6', destaque: 'Ração, acessórios e banho e tosa' }
];

/* ---------- Lojas (estabelecimentos) ---------- */
window.STORES = [
  { id: 'vale-azul', nome: 'Confecções Vale Azul', cat: 'moda', selo: 'oficial', bairro: 'Zona 1', entrega: true, retirada: true, tarifaKm: 1.9, freteGratis: 199, prazo: 'Hoje até 19h', nota: 4.8, avaliacoes: 312, cnpj: '00.000.000/0001-00', cor: '#1F4FA3' },
  { id: 'casa-obra', nome: 'Casa & Obra Noroeste', cat: 'construcao', selo: 'indicada', bairro: 'Zona 7', entrega: true, retirada: true, tarifaKm: 2.5, prazo: 'Amanhã', nota: 4.6, avaliacoes: 188, cnpj: '00.000.000/0002-00', cor: '#B4561F' },
  { id: 'lar-bordado', nome: 'Lar Bordado', cat: 'cama-mesa-banho', selo: null, bairro: 'Centro', entrega: true, retirada: true, tarifaKm: 1.5, freteGratis: 150, prazo: 'Hoje até 20h', nota: 4.9, avaliacoes: 97, cnpj: '00.000.000/0003-00', cor: '#8A3A5C' },
  { id: 'moveis-vale', nome: 'Móveis do Vale', cat: 'moveis', selo: 'oficial', bairro: 'Zona 3', entrega: true, retirada: false, tarifaKm: 3.0, prazo: 'Em até 3 dias', nota: 4.5, avaliacoes: 64, cnpj: '00.000.000/0004-00', cor: '#5B4632' },
  { id: 'bom-preco', nome: 'Mercado Bom Preço', cat: 'mercado', selo: 'indicada', bairro: 'Zona 2', entrega: true, retirada: true, tarifaKm: 1.2, freteGratis: 120, prazo: 'Em 2 horas', nota: 4.7, avaliacoes: 540, cnpj: '00.000.000/0005-00', cor: '#177A4E' },
  { id: 'ponto-cel', nome: 'Ponto do Celular', cat: 'eletronicos', selo: null, bairro: 'Centro', entrega: true, retirada: true, tarifaKm: 1.8, prazo: 'Hoje até 19h', nota: 4.4, avaliacoes: 141, cnpj: '00.000.000/0006-00', cor: '#2B2F3A' },
  { id: 'atelie-linho', nome: 'Ateliê Linho Cru', cat: 'moda', selo: null, bairro: 'Zona 5', entrega: true, retirada: true, tarifaKm: 1.9, prazo: 'Amanhã', nota: 5.0, avaliacoes: 43, cnpj: '00.000.000/0007-00', cor: '#7A6A4F' },
  { id: 'pet-amigo', nome: 'Pet Amigo', cat: 'pet', selo: null, bairro: 'Zona 4', entrega: true, retirada: true, tarifaKm: 1.4, prazo: 'Hoje até 18h', nota: 4.8, avaliacoes: 219, cnpj: '00.000.000/0008-00', cor: '#A16207' }
];

/* ---------- Produtos ----------
   disp: 'ok' | 'pouco' | 'esgotado'  → o comprador nunca vê o saldo numérico.
   vendidos: usado para "Mais vendidos"; quente: para "Em alta". */
window.PRODUCTS = [
  { id: 'p1', nome: 'Camisa social slim fit algodão', loja: 'vale-azul', cat: 'moda', preco: 89.9, de: 119.9, disp: 'ok', vendidos: 820, quente: 9, var: { nome: 'Tamanho', opcoes: ['P', 'M', 'G', 'GG'] } },
  { id: 'p2', nome: 'Calça jeans feminina cintura alta', loja: 'vale-azul', cat: 'moda', preco: 129.9, de: null, disp: 'ok', vendidos: 640, quente: 8, var: { nome: 'Tamanho', opcoes: ['36', '38', '40', '42', '44'] } },
  { id: 'p3', nome: 'Vestido midi linho natural', loja: 'atelie-linho', cat: 'moda', preco: 219.0, de: 259.0, disp: 'pouco', vendidos: 210, quente: 10, var: { nome: 'Tamanho', opcoes: ['P', 'M', 'G'] } },
  { id: 'p4', nome: 'Jaqueta jeans infantil', loja: 'vale-azul', cat: 'infantil', preco: 74.9, de: 89.9, disp: 'ok', vendidos: 305, quente: 6, var: { nome: 'Idade', opcoes: ['4', '6', '8', '10', '12'] } },
  { id: 'p5', nome: 'Kit 3 camisetas básicas', loja: 'atelie-linho', cat: 'moda', preco: 99.9, de: 134.7, disp: 'ok', vendidos: 512, quente: 7, kit: true, var: { nome: 'Tamanho', opcoes: ['P', 'M', 'G', 'GG'] } },
  { id: 'p6', nome: 'Torneira gourmet inox monocomando', loja: 'casa-obra', cat: 'construcao', preco: 214.0, de: 249.0, disp: 'ok', vendidos: 158, quente: 5 },
  { id: 'p7', nome: 'Argamassa AC-III 20 kg', loja: 'casa-obra', cat: 'construcao', preco: 38.5, de: null, disp: 'ok', vendidos: 930, quente: 6 },
  { id: 'p8', nome: 'Furadeira de impacto 650 W', loja: 'casa-obra', cat: 'construcao', preco: 189.9, de: 229.9, disp: 'pouco', vendidos: 120, quente: 7 },
  { id: 'p9', nome: 'Tinta acrílica fosca 18 L — branco neve', loja: 'casa-obra', cat: 'construcao', preco: 289.0, de: 329.0, disp: 'ok', vendidos: 210, quente: 4 },
  { id: 'p10', nome: 'Jogo de lençol queen 4 peças 200 fios', loja: 'lar-bordado', cat: 'cama-mesa-banho', preco: 129.9, de: 159.9, disp: 'ok', vendidos: 450, quente: 8, var: { nome: 'Cor', opcoes: ['Branco', 'Areia', 'Azul'] } },
  { id: 'p11', nome: 'Toalha de banho gigante bordada', loja: 'lar-bordado', cat: 'cama-mesa-banho', preco: 59.9, de: null, disp: 'ok', vendidos: 380, quente: 5 },
  { id: 'p12', nome: 'Toalha de mesa 8 lugares', loja: 'lar-bordado', cat: 'cama-mesa-banho', preco: 79.9, de: 99.9, disp: 'pouco', vendidos: 140, quente: 4 },
  { id: 'p13', nome: 'Rack para TV até 65" madeira', loja: 'moveis-vale', cat: 'moveis', preco: 799.0, de: 949.0, disp: 'ok', vendidos: 64, quente: 6 },
  { id: 'p14', nome: 'Poltrona decorativa linho', loja: 'moveis-vale', cat: 'moveis', preco: 649.0, de: null, disp: 'ok', vendidos: 48, quente: 5 },
  { id: 'p15', nome: 'Café torrado e moído 500 g', loja: 'bom-preco', cat: 'mercado', preco: 18.9, de: 22.9, disp: 'ok', vendidos: 1840, quente: 9 },
  { id: 'p16', nome: 'Cesta básica completa', loja: 'bom-preco', cat: 'mercado', preco: 149.9, de: 169.9, disp: 'ok', vendidos: 720, quente: 8, kit: true },
  { id: 'p17', nome: 'Azeite extra virgem 500 ml', loja: 'bom-preco', cat: 'mercado', preco: 34.9, de: null, disp: 'ok', vendidos: 690, quente: 5 },
  { id: 'p18', nome: 'Smartphone 128 GB tela 6,6"', loja: 'ponto-cel', cat: 'eletronicos', preco: 1299.0, de: 1499.0, disp: 'ok', vendidos: 230, quente: 10 },
  { id: 'p19', nome: 'Fone bluetooth com cancelamento de ruído', loja: 'ponto-cel', cat: 'eletronicos', preco: 199.9, de: 259.9, disp: 'ok', vendidos: 410, quente: 7 },
  { id: 'p20', nome: 'Carregador turbo USB-C 25 W', loja: 'ponto-cel', cat: 'eletronicos', preco: 69.9, de: null, disp: 'esgotado', vendidos: 520, quente: 3 },
  { id: 'p21', nome: 'Ração premium cães adultos 15 kg', loja: 'pet-amigo', cat: 'pet', preco: 189.9, de: 214.9, disp: 'ok', vendidos: 380, quente: 6 },
  { id: 'p22', nome: 'Cama pet acolchoada M', loja: 'pet-amigo', cat: 'pet', preco: 89.9, de: null, disp: 'ok', vendidos: 160, quente: 4 },
  { id: 'p23', nome: 'Camiseta dry fit masculina', loja: 'vale-azul', cat: 'esporte', preco: 49.9, de: 69.9, disp: 'ok', vendidos: 300, quente: 6, var: { nome: 'Tamanho', opcoes: ['P', 'M', 'G', 'GG'] } },
  { id: 'p24', nome: 'Kit skincare facial 3 passos', loja: 'bom-preco', cat: 'beleza', preco: 119.9, de: 149.9, disp: 'pouco', vendidos: 210, quente: 7, kit: true }
];

/* ---------- Vagas de anúncio (mapa de publicidade) ----------
   Valores são EXEMPLOS para o protótipo — tabela real a definir (ver CLAUDE.md).
   precoDia: valor de tabela por dia. Hora = precoDia × 0,08 (mínimo 6 h).
   Teto de contratação: 30 dias por reserva; renovação prioritária para quem ocupa. */
window.AD_SLOTS = [
  { id: 'H1', nome: 'Vitrine principal (carrossel do topo)', pagina: 'home', posicao: 'Topo da home, abaixo do cabeçalho', formato: { desktop: '1200 × 400 px', mobile: '800 × 600 px', proporcao: '3:1 (mobile 4:3)' }, precoDia: 60, rotacao: 4, status: 'leilao', lanceAtual: 92, lances: 7, terminaEm: '2 d 14 h', ocupadoAte: null },
  { id: 'M1', nome: 'Faixa entre seções', pagina: 'home', posicao: 'Entre "Mais vendidos" e "Ofertas"', formato: { desktop: '1200 × 180 px', mobile: '800 × 300 px', proporcao: '20:3 (mobile 8:3)' }, precoDia: 35, rotacao: 2, status: 'disponivel', lanceAtual: null, lances: 0, terminaEm: null, ocupadoAte: null },
  { id: 'M2', nome: 'Dupla de destaques', pagina: 'home', posicao: 'Antes de "Lojas de Cianorte"', formato: { desktop: '2 × 580 × 240 px', mobile: '800 × 330 px', proporcao: '29:12' }, precoDia: 22, rotacao: 2, status: 'ocupado', lanceAtual: null, lances: 0, terminaEm: null, ocupadoAte: '28/11' },
  { id: 'C1', nome: 'Produto patrocinado no carrossel', pagina: 'home', posicao: 'Primeira posição de "Ofertas" e "Em alta"', formato: { desktop: 'Foto do produto 1:1 (moda 4:5)', mobile: 'Mesma foto', proporcao: 'Usa a mídia do produto' }, precoDia: 12, rotacao: 3, status: 'disponivel', lanceAtual: null, lances: 0, terminaEm: null, ocupadoAte: null },
  { id: 'L1', nome: 'Lateral da categoria', pagina: 'categoria', posicao: 'Coluna lateral das páginas de categoria (desktop) / após o 6º produto (mobile)', formato: { desktop: '300 × 600 px', mobile: '800 × 300 px', proporcao: '1:2 (mobile 8:3)' }, precoDia: 18, rotacao: 2, status: 'leilao', lanceAtual: 26, lances: 3, terminaEm: '19 h', ocupadoAte: null },
  { id: 'K1', nome: 'Topo da categoria', pagina: 'categoria', posicao: 'Banner de abertura de cada categoria', formato: { desktop: '1200 × 300 px', mobile: '800 × 400 px', proporcao: '4:1 (mobile 2:1)' }, precoDia: 28, rotacao: 3, status: 'disponivel', lanceAtual: null, lances: 0, terminaEm: null, ocupadoAte: null }
];

/* Anúncios em exibição (criativos de demonstração) */
window.ADS = {
  H1: [
    { titulo: 'Semana da Moda de Cianorte', sub: 'Peças direto das confecções da cidade com até 30% off', cta: 'Ver coleção', bg: '#14213D', fg: '#FFFFFF', acc: '#D7263D', link: '#/c/moda', loja: 'Confecções Vale Azul' },
    { titulo: 'Reforma sem sair de casa', sub: 'Material de construção com entrega amanhã', cta: 'Comprar agora', bg: '#1F4FA3', fg: '#FFFFFF', acc: '#F7F6F2', link: '#/c/construcao', loja: 'Casa & Obra Noroeste' },
    { titulo: 'Compras do mês em 2 horas', sub: 'Mercado com retirada na loja ou entrega rápida', cta: 'Fazer compras', bg: '#177A4E', fg: '#FFFFFF', acc: '#F7F6F2', link: '#/c/mercado', loja: 'Mercado Bom Preço' }
  ],
  M1: { titulo: 'Enxoval bordado à mão, feito em Cianorte', sub: 'Frete grátis acima de R$ 150 no centro', cta: 'Conhecer', bg: '#F4EEF0', fg: '#14213D', link: '#/loja/lar-bordado', loja: 'Lar Bordado' },
  M2: [
    { titulo: 'Troque seu celular', sub: 'Avaliamos seu usado na loja', cta: 'Ver ofertas', bg: '#2B2F3A', fg: '#FFFFFF', link: '#/loja/ponto-cel', loja: 'Ponto do Celular' },
    { titulo: 'Banho e tosa com hora marcada', sub: 'Peça pelo app, busque na loja', cta: 'Saiba mais', bg: '#FDF3E1', fg: '#14213D', link: '#/loja/pet-amigo', loja: 'Pet Amigo' }
  ],
  L1: { titulo: 'Sala nova até o Natal', sub: 'Racks e poltronas com montagem inclusa', cta: 'Ver móveis', bg: '#5B4632', fg: '#FFFFFF', link: '#/loja/moveis-vale', loja: 'Móveis do Vale' },
  K1: { titulo: 'Os mais procurados da categoria', sub: 'Seleção das lojas da cidade', cta: 'Explorar', bg: '#EEF2FA', fg: '#14213D', link: '#', loja: 'Espaço disponível' }
};

/* ---------- Loja do lojista logado no painel (demo) ---------- */
window.SELLER_DEMO = {
  lojaId: 'vale-azul',
  status: 'aprovada',          // rascunho | em_analise | aprovada | suspensa
  visivel: true,               // "Loja visível no marketplace"
  plano: 'Lojista',
  responsavel: '[Nome do responsável]',
  api: { chave: 'ct_live_8f3a••••••••••••••••2b9c', ultimaSync: 'há 4 min', modo: 'api', reserva: 2, falhas24h: 0 },
  pedidos: [
    { id: '10482-A', cliente: 'Comprador #1', itens: 2, total: 219.8, tipo: 'Entrega', status: 'pagamento_confirmado', quando: 'Hoje 10:42' },
    { id: '10479-B', cliente: 'Comprador #2', itens: 1, total: 89.9, tipo: 'Retirada', status: 'pronto_retirada', quando: 'Hoje 09:15' },
    { id: '10471-A', cliente: 'Comprador #3', itens: 3, total: 349.7, tipo: 'Entrega', status: 'saiu_entrega', quando: 'Ontem 17:30' },
    { id: '10466-C', cliente: 'Comprador #4', itens: 1, total: 129.9, tipo: 'Entrega', status: 'entregue', quando: 'Ontem 11:02' },
    { id: '10460-A', cliente: 'Comprador #5', itens: 2, total: 164.8, tipo: 'Retirada', status: 'retirado', quando: '16/11' }
  ],
  estoque: {  // saldo interno (só o lojista vê)
    p1: { saldo: 42, minimo: 10, sku: 'VA-CSL-001' }, p2: { saldo: 18, minimo: 8, sku: 'VA-CJF-002' },
    p4: { saldo: 6, minimo: 8, sku: 'VA-JJI-004' }, p23: { saldo: 0, minimo: 5, sku: 'VA-DRY-023' }
  },
  anuncios: [
    { slot: 'H1', status: 'Lance vencendo', valor: 92, periodo: '20/11 a 26/11' }
  ],
  // Vitrine da loja: só lojas Oficiais e Indicadas configuram (módulos, sem HTML/CSS/JS)
  vitrine: [
    { tipo: 'Banner horizontal', det: '1 imagem · 1200 × 300 px' },
    { tipo: 'Produtos em carrossel', det: '8 produtos · mais vendidos da loja' },
    { tipo: 'Mosaico', det: 'até 4 imagens' },
    { tipo: 'Produtos em grade', det: '12 produtos · ordem manual' },
    { tipo: 'Categorias da loja', det: 'Camisaria, Jeans, Infantil' }
  ],
  equipe: [
    { nome: '[Responsável]', email: 'responsavel@loja.com.br', papel: 'Responsável', perms: ['Pedidos', 'Produtos', 'Estoque', 'Financeiro', 'Anúncios', 'Equipe'] },
    { nome: '[Atendente]', email: 'balcao@loja.com.br', papel: 'Atendimento', perms: ['Pedidos', 'Estoque'] },
    { nome: '[Marketing]', email: 'marketing@loja.com.br', papel: 'Marketing', perms: ['Produtos', 'Anúncios'] }
  ]
};

window.ORDER_STATUS = {
  realizado: 'Pedido realizado', pagamento_confirmado: 'Pagamento confirmado', em_separacao: 'Em separação',
  pronto_envio: 'Pronto para envio', saiu_entrega: 'Saiu para entrega', entregue: 'Entregue',
  pronto_retirada: 'Pronto para retirada', retirado: 'Retirado', cancelado: 'Cancelado'
};
