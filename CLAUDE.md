# Cianorte Tem — contexto do projeto e regras de negócio

Fonte única de verdade para quem desenvolve (pessoa ou IA). Atualize este arquivo sempre que uma regra mudar. Quando houver conflito, a ordem de prioridade é: **decisão registrada do PO > este arquivo > PRD "Tem Logo Ali" v0.2 > protótipo**.

Legenda: **[DECIDIDO]** regra confirmada · **[PROPOSTA]** usada no protótipo, precisa de aprovação · **[PENDENTE]** sem definição (ver seção 12).

---

## 1. Visão

- Marketplace **regional e white label**. Primeira cidade: **Cianorte Tem** (Cianorte/PR). Depois: Maringá Tem, Campo Mourão Tem, Curitiba Tem etc. **[DECIDIDO]**
- Público: comércio geral da cidade (moda, construção, cama/mesa/banho, móveis, mercado, eletrônicos etc.), não só vestuário. **[DECIDIDO]**
- Parceria com associações comerciais locais (em Cianorte: ACIC) para adesão e divulgação. **[DECIDIDO]** Condições comerciais **[PENDENTE]**.
- Referência de experiência: Mercado Livre (navegação, vitrines, anúncios entre seções), mas com identidade da cidade, menos poluição visual e foco em "loja do vizinho".
- O PRD "Tem Logo Ali" (Escadio, v0.2) é insumo: o nome do produto passa a ser `<Cidade> Tem`.

## 2. White label (multi-cidade)

- **Categorias na demonstração:** Admin › Categorias permite criar, editar e excluir categorias e subcategorias. As alterações ficam no navegador, separadas por cidade, e aparecem no catálogo e no editor de produtos do mesmo navegador. Os identificadores existentes permanecem ao alterar o nome. A exclusão de itens vinculados a produtos ou lojas exige reclassificação prévia. Na versão real, o cadastro, a integridade das referências e a publicação devem ser gerenciados pela API e pelo banco.

- Cada cidade é um **tenant** com: `slug`, `nome`, `marca`, `uf`, `cepPadrao`, `acento` (cor da etiqueta "Tem"), `associacao`, `slogan`, `cepsAtendidos` e domínio/subdomínio.
- Iguais em todas as cidades: layout, tipografia, marinho, azul de ação, neutros, verde de "loja local", pesponto e etiqueta.
- Muda por cidade: nome, cor do acento (tirada da bandeira da cidade), associação parceira, textos institucionais e base de CEPs.
- No front atual, essa configuração vem de `src/mocks/tenants.ts`, passa por `getTenant()` e pelo `TenantProvider`; o middleware resolve a cidade pelo domínio. No back-end, ela deve vir de `GET /v1/tenant` resolvido pelo domínio. `window.CITY` pertencia ao protótipo antigo.
- Lojas, produtos, pedidos e anúncios sempre pertencem a um tenant. Nenhuma consulta cruza tenants.

## 3. Identidade visual (tokens)

| Token | Hex | Uso |
| --- | --- | --- |
| marinho | #14213D | cabeçalho, rodapé, títulos, item ativo |
| azul (ação) | #1F4FA3 | botões, links, foco |
| azul-névoa | #EEF2FA | fundos de apoio |
| acento (Cianorte) | #D7263D | etiqueta "Tem", ofertas e alertas (pouco) |
| verde | #177A4E | "Loja de Cianorte", entrega, sucesso |
| linho | #F7F6F2 | fundo da página |
| grafite | #1A1F2B | texto (secundário #4A5468) |

- Fontes: **Outfit** (títulos e preços) e **Inter** (interface).
- A cultura de "capital do vestuário" entra pela **forma**: o "Tem" é uma etiqueta de roupa, e o **pesponto tracejado** (`.stitch`) marca cartões, anúncios e destaques.
- **Não usar** o escudo nem o leão do Cianorte FC (marca do clube). Usar as cores é livre.
- Mídia de produto: **moda 4:5**, demais categorias **1:1**, vídeo **9:16**. A galeria tem ordem configurável. **[DECIDIDO no PRD]**

## 4. Perfis e acesso

| Perfil | Acessa |
| --- | --- |
| Visitante | Toda a vitrine, busca, produto, lojas e sacola. **Não precisa de login para navegar.** |
| Comprador | Tudo do visitante + checkout, pedidos, endereços, favoritos, privacidade |
| Lojista (responsável) | Painel da própria empresa e unidades: produtos, estoque, pedidos, anúncios, cadastro |
| Equipe do lojista | Mesmo painel com permissões por papel **[PENDENTE: matriz]** |
| Admin do marketplace | Aprovação de lojas, moderação de produtos e anúncios, financeiro, auditoria |
| Associação parceira | Relatórios de adesão dos associados **[PROPOSTA]** |

- Autorização **sempre no servidor**, por recurso: comprador A não vê pedidos de B; equipe de uma empresa não vê outra, nem por URL nem por API (PRD-01).
- Empresa, estabelecimento (unidade/filial) e usuário são entidades diferentes. Uma empresa pode ter várias unidades, cada uma com **cadastro e aprovação próprios**; unidade não aprovada não vende (PRD-02).

## 5. Jornada do comprador

### 5.1 Navegação
- Home geral com, nesta ordem: carrossel patrocinado (H1), atalhos de categoria, faixa de confiança, **Mais vendidos**, anúncio em faixa (M1), **Melhores preços** (com produto patrocinado C1), vitrine "Direto das confecções" (identidade local), **Em alta**, dupla de anúncios (M2), **Lojas da cidade** e chamada para lojistas.
- Cada **categoria** tem página própria com a mesma lógica: banner de topo (K1), Mais vendidos da categoria, Melhores preços, todos os produtos com filtros e anúncio lateral (L1).
- Filtros mínimos: mais vendidos, menor preço, maior desconto, chega hoje, retirada na loja, lojas oficiais.
- Mobile/PWA: cabeçalho com marca, CEP, favoritos e sacola + busca; **barra inferior flutuante** com Início, Categorias, Sacola e Conta (item ativo em bloco marinho). Na página de produto, a barra dá lugar à barra de compra fixa.

### 5.2 Localização e cobertura (PRD-03, PRD-09)
- O CEP orienta as ofertas. Fora da cobertura, a compra é **bloqueada também por acesso direto** (URL do produto).
- Trocar o CEP sinaliza itens incompatíveis, e o checkout revalida.
- **Entrega:** frete = distância **pelas ruas** (rota real) × tarifa por km da loja. No protótipo a distância é fixa (3,4 km) e o frete mínimo é R$ 6. **[PROPOSTA]**
- **Retirada:** grátis, só quando a cidade do comprador é a mesma da unidade, sem limite de km. Ampliar a entrega não amplia a retirada.

### 5.3 Produto
- O comprador **nunca vê o saldo numérico**; vê Disponível, Últimas unidades ou Indisponível.
- **[PROPOSTA]** "Últimas unidades" quando saldo disponível ≤ estoque mínimo do lojista.
- Variações obrigatórias precisam ser escolhidas antes de adicionar (PRD-05).
- Kits têm ao menos dois produtos distintos e consomem o estoque dos componentes.
- Mostrar sempre a identificação do fornecedor: nome, CNPJ e endereço da loja (Decreto 7.962/2013).
- Selos: **Loja oficial** (registro de marca + cartão CNPJ + contrato social, sem volume mínimo) e **Indicada** (≥ 100 pedidos em um dia; mantém com média diária ≥ 100 nos últimos 6 meses, revisão semestral). **[DECIDIDO no PRD]**

### 5.4 Sacola e checkout (PRD-06)
- O visitante monta a sacola sem conta. **A sacola é mantida ao entrar ou criar conta.** Fechar a compra exige login.
- Sacola **multiloja**, agrupada por loja. Frete por loja. Cada loja escolhe entrega ou retirada separadamente.
- Checkout em 3 etapas: **Entrega → Pagamento → Revisão**.
- A compra gera **pedido principal + subpedidos por estabelecimento** (ex.: 10501-A, 10501-B).
- O servidor **revalida** preços, disponibilidade e cobertura ao confirmar.
- Antes de pagar, mostrar o **resumo das condições**: arrependimento em 7 dias, prazo contado após a confirmação do pagamento, garantia legal e link da política de privacidade.

### 5.5 Pagamento (PRD-07)
- Pix e cartão de crédito. Provedor **[PENDENTE: PO-03]**, com suporte a split (loja/plataforma).
- Dados do cartão vão direto ao provedor (tokenização). **Nunca armazenar número nem CVV.**
- Webhook de confirmação **idempotente**: evento repetido não duplica cobrança, baixa de estoque nem efeito financeiro.
- Só pagamento confirmado libera o avanço operacional.
- Comissão uniforme **só sobre produtos**; o frete pertence ao lojista; a taxa do provedor é descontada do lojista sem duplicar. Percentual **[PENDENTE]**.

### 5.6 Estados do pedido (por subpedido)
- Entrega: realizado → pagamento confirmado → em separação → pronto para envio → saiu para entrega → entregue.
- Retirada: realizado → pagamento confirmado → em separação → pronto para retirada → retirado.
- Digital: realizado → pagamento confirmado → entregue (arquivo liberado).
- Financeiro e operação são dimensões separadas. Cada loja avança só a sua parte. Análise administrativa bloqueia o avanço e exige motivo e auditoria.
- Pós-venda (cancelamento, devolução, reembolso parcial/total, chargeback) **[PENDENTE: PO-04]**.

### 5.7 Conta
- Meus dados, Pedidos, Endereços, Favoritos, Privacidade e dados, Sair.
- Editar o cadastro **não altera** dados históricos de pedidos. A recompra consulta preço e disponibilidade atuais.

## 6. LGPD e Código de Defesa do Consumidor

- **Cadastro:** nome, CPF (para nota fiscal), e-mail, celular, senha (mín. 8 caracteres). Checkboxes **não pré-marcados**:
    - aceite de Termos de Uso + Política de Privacidade (obrigatório);
    - declaração de 18 anos ou mais (obrigatório);
    - ofertas por e-mail/WhatsApp (opcional e separado).
- Registrar o **consentimento** com data/hora, versão dos termos aceita e IP.
- Bases legais: execução de contrato (compra, entrega, nota), obrigação legal (fiscal), legítimo interesse (antifraude) e consentimento (marketing, cookies de medição e anúncios).
- Cada loja recebe **só os dados necessários** para atender o seu subpedido.
- **Banner de cookies** com "Aceitar todos" e "Só necessários". A escolha é alterável em Conta › Privacidade.
- **Central de privacidade:** baixar meus dados (portabilidade), corrigir, excluir conta (mantendo o que a lei exige, como notas fiscais) e revogar consentimentos. Mostrar o contato do encarregado (DPO) **[PENDENTE]**.
- **CDC:**
    - direito de arrependimento em 7 dias (art. 49);
    - garantia legal de 90 dias;
    - identificação do fornecedor;
    - resumo do contrato antes de finalizar;
    - confirmação imediata do pedido;
    - atendimento eletrônico (chat pós-compra, PRD-13).
- **Publicidade:** todo anúncio leva o rótulo "Patrocinado" e o nome do anunciante, e as peças passam por moderação (CDC e CONAR).
- Os textos jurídicos do protótipo são **provisórios**. A versão final é do jurídico.

## 7. Painel do lojista

### 7.1 Adesão
1. Empresa: CNPJ, razão social, nome fantasia, IE.
2. Responsável: nome, CPF, e-mail, celular.
3. Unidade: endereço, horário de funcionamento.
4. Recebimento: conta cadastrada **no provedor de pagamento** (split).
5. Documentos: cartão CNPJ (obrigatório); contrato social e registro de marca (para o selo Loja oficial).
6. Aceite do Contrato do Lojista.

- **Logo da loja:** no cadastro, o lojista pode selecionar uma imagem JPG, PNG ou WebP de até 2 MB, visualizar e salvar. Na demonstração, a imagem é reduzida e guardada no navegador por cidade e loja, aparecendo na vitrine, no painel e nos anúncios. No back-end, a logo deve ser armazenada por estabelecimento e disponibilizada pela API.

- Status: `rascunho` → `em_analise` → `aprovada` | `reprovada` | `suspensa`. **[PROPOSTA]** Prazo de análise de até 2 dias úteis.

### 7.2 Loja visível
- Interruptor **"Loja visível no marketplace"**. Só pode ser ligado com status `aprovada`.
- Desligar oculta a vitrine e os produtos, mas **pedidos em andamento continuam**.

### 7.3 Produtos e moderação (PRD-04)
- Tipos: simples, com variações, kit e digital (download, sem cursos em vídeo).
- Produto novo e alterações **editoriais** (nome, fotos, descrição, categoria) exigem aprovação.
- **Preço e estoque atualizam na hora**, sem moderação. Aprovar conteúdo não restaura preço ou estoque antigos.
- Alterar o preço pode gerar um aviso de ofertas equivalentes de outras lojas, sem bloquear a mudança (PRD-18).

### 7.4 Entrega e operação
- Tarifa por km, horário de corte (padrão 15h; mudar o corte só afeta novas compras), retirada sim/não e filiais.

## 8. Estoque e API aberta

**Objetivo:** o comprador nunca comprar algo que a loja física já vendeu.

- **Modos de sincronização:**
    - **Manual:** o lojista ajusta no painel.
    - **Planilha:** CSV `sku;quantidade`.
    - **API aberta:** o sistema da loja empurra o saldo.
- **Reserva de segurança por produto:** unidades guardadas para o balcão.
    - Disponível para venda = saldo − reserva − reservas de pedidos não entregues.
- **Reserva de estoque no checkout:** ao criar o pedido, reservar; ao confirmar o pagamento, baixar; ao expirar ou cancelar, liberar. Compra concorrente **não gera saldo negativo** (lock/transação).
- Um SKU é único por loja. O lojista usa o **mesmo SKU** do sistema da loja física.
- **Endpoints** (autenticação por chave da API da loja, `Authorization: Bearer`):

| Método | Rota | Descrição |
| --- | --- | --- |
| PUT | `/v1/lojas/{lojaId}/estoque/{sku}` | Atualiza o saldo de um SKU. Body `{ saldo, atualizadoEm }`. Exige `Idempotency-Key`. Ignora atualização com `atualizadoEm` mais antigo que o último aplicado. |
| POST | `/v1/lojas/{lojaId}/estoque/lote` | Atualiza vários SKUs. Body `{ itens: [{ sku, saldo }] }`. Resposta por item (aplicado/erro). |
| GET | `/v1/lojas/{lojaId}/estoque/{sku}` | Saldo, reservado e disponível. |
| GET | `/v1/lojas/{lojaId}/estoque/{sku}/reservas` | Reservas de pedidos em aberto. |

- **Webhooks para o sistema da loja:** `pedido.pago`, `pedido.cancelado`, `pedido.devolvido`. Assinados com HMAC, com retentativas exponenciais e registro de entregas.
- **Chave da API:** mostrada por inteiro só uma vez; "gerar nova" revoga a anterior em 24 h.
- **Painel:** última sincronização, falhas nas últimas 24 h e histórico de movimentações (reabastecimento, ajuste manual, saída automática por venda).
- **Rate limit [PROPOSTA]:** 60 req/min por loja; lote de até 500 itens.

## 9. Publicidade (anúncios)

- **[DECIDIDO]** A demonstração mostra criativos com imagem no topo e na lateral de todas as categorias de Cianorte. O anúncio de móveis “Sala nova até o Natal” continua visível como destaque adicional, inclusive nas demais categorias. As demais peças de categoria usam lojas com produtos naquela categoria.
- **[DECIDIDO]** Cada anunciante da demonstração tem identidade fictícia nos anúncios. As fotos ficam visíveis com um véu neutro uniforme por padrão; o degradê continua disponível para peças que o solicitarem.

- **[DECIDIDO]** A central apresenta mapas separados para a página inicial e para as páginas de categoria. As vagas K1 e L1 são vinculadas à categoria de atuação da loja, cada uma com sua contratação e período.
- **[DECIDIDO]** H1 é um carrossel automático com até quatro anunciantes, controles manuais e pausa.
- **[PROPOSTA]** Na demonstração, H1 usa R$ 2.000 por dia e os banners M1 e M2 usam R$ 500 por dia. Os valores e a unidade de cobrança precisam de confirmação comercial.
- Esses exemplos de H1, M1 e M2 substituem os valores anteriores da tabela abaixo.

### 9.1 Mapa de vagas
O lojista vê um **mapa do site** com cada vaga, a situação dela (Livre, Em lance, Ocupada), o formato e o preço.

| Vaga | Onde | Desktop | Celular | Rotação | Tabela/dia **[PROPOSTA]** |
| --- | --- | --- | --- | --- | --- |
| H1 | Carrossel do topo da home | 1200×400 | 800×600 | até 4 | R$ 60 |
| M1 | Faixa entre Mais vendidos e Ofertas | 1200×180 | 800×300 | até 2 | R$ 35 |
| M2 | Dupla antes de Lojas | 2× 580×240 | 800×330 | até 2 | R$ 22 |
| C1 | Produto patrocinado em Ofertas/Em alta | mídia do produto | mídia do produto | até 3 | R$ 12 |
| K1 | Topo de cada categoria | 1200×300 | 800×400 | até 3 | R$ 28 |
| L1 | Lateral da categoria (no mobile, após o 6º produto) | 300×600 | 800×300 | até 2 | R$ 18 |

- **Arquivo:** JPG, PNG ou WebP até 500 KB, com textos a 40 px das bordas. Há um modelo pronto para quem não tem arte.
- **Rótulo:** todo anúncio exibe "Patrocinado" + nome da loja. Anúncio não pode poluir a navegação: no máximo um bloco de anúncio entre duas seções de produtos.

### 9.2 Tempo e preço **[PROPOSTA]**
- **Unidades:** horas (mínimo 6, máximo 72), dias (1 a 30), semanas (1 a 4) ou 1 mês. **Teto: 30 dias por contratação.**
- **Valor de tabela:** hora = 8% da diária; semana = 7 × diária; mês = 30 × diária. Quanto mais tempo, maior o total.
- **Ao fim do período:** quem ocupa tem preferência de renovação pelo mesmo valor até 48 h antes do fim; senão, a vaga volta para a disputa.

### 9.3 Lances **[PROPOSTA]**
- **Vaga Livre:** contrata pelo valor de tabela ou dá lance maior por prioridade na rotação.
- **Vaga Em lance:** lance mínimo = lance atual + R$ 2/dia. Ganha o maior lance por dia; em empate, o lance mais antigo.
- **Vaga Ocupada:** lance para o próximo período.
- **Cobrança:** só se o lance vencer. Anúncio reprovado na moderação é reembolsado.
- **Estados da campanha:** `lance_ativo`, `lance_superado`, `vencedor_aguardando_arte`, `arte_em_analise`, `no_ar`, `encerrada`, `reprovada`.

## 10. Modelo de dados (entidades mínimas)

- **[DECIDIDO]** O comprador pode avaliar cada loja após o pagamento do seu subpedido. A loja e seus produtos apresentam a média, a quantidade de avaliações e a quantidade de itens vendidos como métricas distintas. Na demonstração, avaliações novas ficam no navegador e vendas usam os dados fictícios do catálogo. No back-end, registrar e agregar as avaliações por tenant e estabelecimento, com uma avaliação por comprador e subpedido.

`Tenant`, `Usuario`, `Consentimento`, `Endereco`, `Empresa`, `Estabelecimento` (unidade), `MembroEquipe`, `DocumentoEmpresa`, `Categoria`, `Produto`, `Variacao`, `ComponenteKit`, `Midia`, `ModeracaoConteudo`, `Estoque` (por SKU/unidade), `MovimentoEstoque`, `ReservaEstoque`, `ChaveApi`, `WebhookEndpoint`, `EntregaWebhook`, `Sacola`, `ItemSacola`, `Pedido`, `Subpedido`, `ItemPedido`, `EventoPedido`, `Pagamento`, `EventoPagamento`, `Repasse`, `Favorito`, `VagaAnuncio`, `TabelaPrecoVaga`, `Lance`, `Campanha`, `CriativoAnuncio`, `Selo`, `Auditoria`.

- Valores monetários sempre em **centavos (inteiro)**.
- Datas em **UTC** no banco, exibidas em `America/Sao_Paulo`.
- Subpedido guarda uma **cópia** dos dados da unidade e do comprador no momento da compra.

## 11. Contratos de API que o front espera (rascunho)

| Front (arquivo/rota) | Endpoint |
| --- | --- |
| `CITY` | `GET /v1/tenant` |
| Home | `GET /v1/vitrine/home` (seções + anúncios ativos por vaga) |
| Categoria | `GET /v1/categorias`, `GET /v1/categorias/{id}/vitrine?ord=&f=&cep=` |
| Busca | `GET /v1/produtos?q=&cat=&ord=&cep=&pagina=` |
| Produto | `GET /v1/produtos/{id}?cep=` (inclui disponibilidade, frete e retirada para o CEP) |
| Loja | `GET /v1/lojas`, `GET /v1/lojas/{id}` |
| Sacola | `GET/PUT /v1/sacola` (por sessão anônima; funde com a do usuário no login) |
| Checkout | `POST /v1/checkout/cotacao`, `POST /v1/pedidos` (Idempotency-Key) |
| Pagamento | `POST /v1/pedidos/{id}/pagamento`, `POST /v1/webhooks/pagamento` |
| Conta | `POST /v1/auth/cadastro`, `POST /v1/auth/entrar`, `GET /v1/me`, `GET /v1/me/pedidos`, `POST /v1/me/privacidade/exportar`, `POST /v1/me/privacidade/excluir` |
| Painel | `GET /v1/painel/resumo`, `GET/PATCH /v1/painel/pedidos`, `GET/POST/PATCH /v1/painel/produtos`, `PATCH /v1/painel/loja` (visível), `POST /v1/painel/cadastro` |
| Anúncios | `GET /v1/anuncios/vagas`, `POST /v1/anuncios/lances`, `POST /v1/anuncios/contratacoes`, `POST /v1/anuncios/criativos` |

## 12. Pendências (do PRD, seção 9)

| ID | Pendência |
| --- | --- |
| PO-01 | Lojas e cidades do piloto |
| PO-02 | Orçamento e data-alvo |
| PO-03 | Provedor de pagamento e percentual de comissão |
| PO-04 | Políticas de pós-venda |
| PO-05 | Base de CEPs, calendário e fórmula de prazo |
| PO-06 | Fiscal |
| PO-07 | Equivalência de produtos, chat, digitais e permissões |
| PO-08 | Cupons e frete grátis |
| PO-09 | Sessões, canais e retenção de dados |

**Novas pendências deste protótipo:**
- tabela real de preços das vagas e regras de leilão;
- condições da parceria com a ACIC;
- texto jurídico dos termos e da privacidade;
- nome do encarregado (DPO).

## 13. Front-end (Next.js)

### 13.1 Stack **[DECIDIDO 18/11/2026]**
- **Next.js 15 (App Router) + TypeScript**, Tailwind CSS 3 (tokens no `tailwind.config.ts`), fontes Outfit e Inter locais via `next/font/local` (`apps/web/src/fonts`), ícones `lucide-react`, estado da sacola e da sessão em Zustand.
- **Qualidade:** ESLint + Prettier; Vitest (regras) e Playwright (jornadas em 390 px e 1440 px) na etapa 6.
- **Back-end (fase 2):** Node com NestJS + PostgreSQL, seguindo as seções 10 e 11. O front não muda quando ele entrar, só `src/lib/api`.
- A migração terminou em 19/11/2026 e a pasta `prototipo/` foi removida. Para consultar a versão HTML/CSS/JS original: o protótipo original está no histórico do Git (commit cf1d609, branch feat/prototipo-front-end). Comentários "protótipo: vXxx" no código apontam para as funções de lá.

### 13.2 Estrutura de pastas
```
/                         raiz do repositório (monorepo)
├── CLAUDE.md             regras de negócio (este arquivo)
├── package.json          comandos da raiz (dev, build, test, test:e2e, verificar) que repassam para cada app
│                         [DECIDIDO 19/11/2026] estrutura apps/ mantida; sem workspaces (cada app com seu lock e Dockerfile)
├── docker-compose.yml    web + proxy hoje; api + db no profile "backend"
├── .env.example          variáveis de todos os serviços (o .env real nunca vai para o Git)
├── infra/caddy/          proxy reverso com HTTPS automático
└── apps/
    ├── web/              front-end Next.js
    │   ├── Dockerfile    imagem standalone, usuário sem privilégio
    │   ├── tailwind.config.ts   tokens (única fonte de cores)
    │   ├── e2e/         testes Playwright (jornadas + acessibilidade)
    │   ├── public/sw.js service worker do PWA
    │   └── src/
    │       ├── middleware.ts    host → cidade (reescreve para /[tenant]/...)
    │       ├── app/[tenant]/    layout raiz por cidade (marca e acento no SSR)
    │       │   ├── (comprador)/ rotas do comprador
    │       │   ├── painel/      painel do lojista (layout próprio, noindex)
    │       │   └── dev/tokens/  vitrine de tokens (só dev/demo)
    │       ├── components/      marca, ui (ícones), layout/comprador, vitrine, anuncios, providers
│       ├── stores/          estado do cliente (Zustand): sacola, sessão, CEP, cookies
│       ├── hooks/           hooks de cliente (ex.: sacola agrupada por loja)
    │       ├── lib/api/         ÚNICA porta de dados: mocks hoje, NestJS amanhã
    │       ├── lib/regras/      regras puras (frete, disponibilidade, anúncios, dinheiro)
    │       ├── lib/tenant/      resolução da cidade + getTenant()
    │       ├── mocks/           dados fictícios por cidade (convertidos do protótipo original)
│       ├── app/manifest.webmanifest, app/icons/  PWA por cidade (fora de [tenant])
    │       └── types/domain.ts  tipos espelhando as entidades da seção 10
    └── api/              (fase 2) back-end NestJS
```

### 13.3 Rotas
- **Comprador:** `/`, `/categorias`, `/c/[categoria]`, `/p/[produto]`, `/loja/[loja]`, `/lojas`, `/busca`, `/ofertas`, `/sacola`, `/checkout`, `/pedido/[id]`, `/entrar`, `/cadastro`, `/conta/[aba]` (`/conta` → `/conta/dados`), `/termos`, `/privacidade`, `/vender`.
- **Admin:** `/admin`, `/admin/lojas` (`?aba=cadastros|lojas|filiais`), `/admin/moderacao`, `/admin/pedidos` (`?f=todos|abertos|analise|concluidos`), `/admin/financeiro`, `/admin/regras`, `/admin/auditoria`.
- **Painel:** `/painel`, `/painel/pedidos`, `/painel/produtos`, `/painel/produtos/novo`, `/painel/estoque`, `/painel/anuncios`, `/painel/financeiro`, `/painel/vitrine`, `/painel/loja`, `/painel/equipe`, `/painel/cadastro`.
- **Renderização por rota:** home, categorias e lojas em ISR (5 min); produto em ISR (60 s, pré-gerado por cidade); loja em ISR (5 min); categoria, busca e ofertas renderizadas no servidor a cada requisição, porque ordenação e filtros vêm da URL (`?ord=vendidos|menor|desconto&f=hoje|retirada|oficial`). Os filtros são links: funcionam sem JavaScript e podem ser compartilhados.
- **SEO:** título, descrição e canonical por página; dados estruturados `WebSite` (home), `Product` com `Offer` e disponibilidade (produto) e `Store` (loja). O JSON-LD escapa `<` porque os textos vêm do lojista (proteção contra XSS). A busca não é indexada (`noindex`).
- **Isolamento por cidade:** produto ou loja de outra cidade responde 404 (ex.: `/p/p1` em maringa.).

### 13.4 White label no front **[DECIDIDO]**
- O `middleware.ts` lê o host (`cianorte.` → Cianorte Tem, `maringa.` → Maringá Tem, ou domínio próprio cadastrado) e reescreve a URL para `/[tenant]/...`. O usuário não vê o segmento.
- `getTenant(slug)` é a única fonte de marca, acento, associação e CEPs. **Nenhum nome de cidade fixo no código** (só nos mocks, que são dados).
- O acento da cidade vira variável CSS (`--acento-rgb`) no `<html>`, e o token `acento` do Tailwind lê essa variável.
- Em desenvolvimento: `http://cianorte.localhost:3000` e `http://maringa.localhost:3000`. `localhost` puro usa `DEFAULT_TENANT`.

### 13.5 Tokens e regras de código
- **Nenhuma cor fora dos tokens.** A paleta padrão do Tailwind está desligada, e o ESLint acusa erro em qualquer hex fora de `src/mocks` e `tailwind.config.ts`. Cores que são **dado** (tom da categoria, cor da loja, fundo do criativo) chegam pela API e entram via `style`.
- Dinheiro em centavos (`Centavos`) do mock à tela; formatação só em `lib/regras/dinheiro.ts`.
- Alvos de toque de no mínimo 44 px (`min-h-toque`), contraste 4,5:1 e navegação por teclado.
- **Modo demo:** `NEXT_PUBLIC_DEMO_MODE=true` liga "Simular pagamento", "Simular aprovação" e `/dev/tokens`. Em produção fica `false`.
- **Primitivos do design system** (`.btn`, `.pill`, `.status`, `.card`, `.chip`, `.stitch`, `.input`, `.banner-info`, `.legal-box`) ficam em `globals.css` (`@layer components`, só com tokens), porque se repetem em dezenas de telas. O resto é utilitário do Tailwind direto no componente.
- **Pontos de quebra** iguais aos do protótipo: `sm` 640, `md` 760, `lg` 900 (vira desktop: cabeçalho completo, sem barra inferior), `xl` 1000, `2xl` 1100, `3xl` 1240.
- **Estado do comprador** (`src/stores/comprador.ts`, Zustand): sacola, favoritos, CEP, escolha de cookies e sessão de demonstração, salvos no aparelho. Cada cidade tem seu domínio, então o armazenamento não se mistura entre cidades. A sessão real será cookie `httpOnly` da API (seção 15).
- **Renderização:** layout e vitrines no servidor; só CEP, busca, sacola, favoritos, cookies, modais e carrosséis são componentes de cliente. A home é ISR (revalida a cada 5 min) por cidade e publica dados estruturados `WebSite` + `SearchAction`.

### 13.6 Ajustes de visual decididos na migração
- **[DECIDIDO 18/11/2026] A marca não muda de cor no hover.** No protótipo, o `a:hover` global deixava o nome da cidade marinho sobre fundo marinho e ele sumia. O componente `Marca` fixa as cores nos próprios elementos.
- **[DECIDIDO 18/11/2026] Barra de categorias sem corte:** o que não cabe na largura vai para o menu "Mais" no fim da barra (calculado pela largura real de cada item). Antes a última categoria aparecia cortada.
- **[DECIDIDO 18/11/2026] Cabeçalho:** saiu o link "Venda no <Cidade> Tem" (repetia o "Quero vender"). "Quero vender", na faixa de cima, virou uma etiqueta no formato do "Tem" da marca: fundo do acento da cidade, texto branco, bolinha e pesponto. "Entrar" virou botão branco com texto azul e ícone de pessoa, para ser achado de primeira.
- **Acessibilidade (etapa 6):** tabelas com rolagem lateral são regiões focáveis pelo teclado; o nome lido pelos leitores de tela nos links de marca, anúncios, cartões de produto e vagas do mapa coincide com o texto visível; cinza-claro sobre fundo bege foi trocado pelo cinza de texto secundário; links no meio de texto são sublinhados; `.btn-sm` tem 44 px no celular (36 px no desktop).
- **[PROPOSTA]** Botões de favoritar e "+" do cartão mantêm o círculo de 36 px do protótipo, mas a área clicável passou a ter 44 px (acessibilidade). As setas do carrossel passaram de 40 para 44 px.
- **[PROPOSTA]** Vaga K1 sem anunciante no período mostra o convite "Anuncie no topo de <categoria>" (como no protótipo). Com anunciante, vira faixa patrocinada.
- **[PROPOSTA]** Vaga L1 no celular aparece depois do 6º produto e some no desktop (≥ 1000 px), onde já está na coluna lateral. No protótipo ela aparecia nos dois lugares no desktop; segui a regra da seção 9.1.

### 13.6.1 Comprador: conta, checkout e pedido (etapa 4)
- **Proteção de telas:** conta, checkout e pedido exigem login (`ExigeLogin`). Quem chega sem login vai para "Entrar" (com `?next=checkout` vindo do checkout); quem sai da conta vai para o início. Na versão real a proteção é a sessão validada no servidor; isto só evita a tela vazia.
- **[DECIDIDO 19/11/2026] Volta para a tela de origem:** depois de entrar ou criar conta, a pessoa volta para a tela de onde saiu (`?next=`); sem origem, vai para o início. `destinoSeguro` (`lib/regras/redirecionamento.ts`) só aceita caminhos deste site: recusa `//`, `https://`, ``, caracteres de controle e o próprio login (evita redirecionamento aberto). `?next=checkout` continua aceito.
- **Formulários de login e cadastro usam `method="post"`**: se o JavaScript não carregar, senha e CPF nunca vão para a URL. A busca do cabeçalho funciona sem JavaScript (`action="/busca"`).
- **[PROPOSTA] Validações do cadastro no front** (o back-end repete): nome e sobrenome, CPF com dígito verificador, celular com DDD, e-mail, senha com 8+ caracteres e letras e números (o protótipo só checava o tamanho, mas o texto de ajuda já pedia letras e números). Termos e idade obrigatórios; marketing opcional; nenhum pré-marcado. Versão dos termos enviada no cadastro: `VERSAO_TERMOS` em `lib/regras/cadastro.ts`.
- **[PROPOSTA] Checkout:** para avançar da etapa Entrega é obrigatório CEP, rua, número e bairro quando alguma loja for por entrega (o protótipo não validava). Se o CEP sair da área atendida, entrega e retirada ficam indisponíveis e o avanço é bloqueado (revalidação do CDC/PRD-03).
- **Pedido:** número e subpedidos (`10501-A`, `10501-B`) como no protótipo; `POST /v1/pedidos` recebe uma `Idempotency-Key` por tentativa (clique duplo não cria dois pedidos). Datas exibidas em `America/Sao_Paulo`.
- **Cartão:** os campos na tela são só ilustrativos e não são guardados; na versão real virão do SDK do provedor (tokenização).
- **Modo demo:** "Simular pagamento" (Pix) e "Simular aprovação" (cartão) só aparecem com `NEXT_PUBLIC_DEMO_MODE=true`. Sem a variável, a tela diz que a confirmação chega sozinha (webhook).

### 13.6.2 Painel do lojista e anúncios (etapa 5)
- **Layout próprio** em `/painel` (menu lateral, loja ativa com status, interruptor "Loja visível", `noindex`). O interruptor só liga com cadastro `aprovada` (§7.2).
- **Estado da demo** em `src/stores/painel.ts` (Zustand, salvo no aparelho). Cada ação corresponde a um endpoint da seção 11; com o back-end, o store vira chamadas à API e a permissão de cada ação é conferida no servidor.
- **Pedidos:** botão de avanço usa `proximoStatus` (`lib/regras/pedidos.ts`): pedido sem pagamento confirmado não avança; cada loja avança só a sua parte. **[PROPOSTA]** Os filtros Todos / A separar / Concluídos passaram a funcionar (no protótipo eram só visuais).
- **Estoque:** "Comprador vê" usa `disponibilidadePublica` (saldo − reserva de segurança; ≤ mínimo = Últimas unidades). Mudar a reserva recalcula na hora.
- **Financeiro:** comissão 10% e taxa 2% **ilustrativas** (PO-03), calculadas em centavos por pedido. Por isso "Disponível para saque" pode diferir em 1 centavo do protótipo, que arredondava só no total.
- **Anúncios:** valor de tabela, lance mínimo (lance atual + R$ 2) e limites de tempo vêm de `lib/regras/anuncios.ts`. O convite da vaga K1 na categoria abre `/painel/anuncios?vaga=K1` (antes `?slot=`).
- **Simular aprovação** do cadastro só no modo demo.
- Cidade sem loja de demonstração (ex.: Maringá) mostra "Nenhuma loja vinculada".
- Tabelas não quebram linha nas células; no celular rolam na horizontal dentro do cartão. **[PROPOSTA 19/11/2026]** Exceção: o nome do produto (texto livre do lojista) quebra em até 2 linhas.

### 13.6.3 PWA e testes (etapa 6)
- **Manifest por cidade:** `/manifest.webmanifest` é gerado pelo host (nome, descrição, atalhos Ofertas/Sacola/Meus pedidos). Instalar em cianorte.* cria "Cianorte Tem"; em maringa.*, "Maringá Tem".
- **Ícones por cidade:** `/icons/icon.svg`, `192.png`, `512.png`, `maskable-512.png` e `apple-180.png` são gerados com o monograma da marca (CT, MT…) e a etiqueta "Tem" na cor do acento da cidade (mesmo desenho do protótipo).
- **Service worker** (`public/sw.js`, só em produção e HTTPS/localhost): estáticos do Next e ícones em cache; páginas públicas em **rede primeiro** com cópia para abrir offline (preço e estoque nunca saem do cache se houver rede); **conta, checkout, pedido, painel, sacola, entrar e cadastro nunca vão para o cache**; sem rede e sem cópia, mostra `/offline`.
- **Barra inferior flutuante** no celular (etapa 2) e barra de compra fixa na página de produto (etapa 3).
- **Vitest** (`npm test`): regras de frete, frete grátis, cobertura e retirada; disponibilidade pública; valor de anúncio, limites de tempo e lance mínimo; dinheiro; validações do cadastro; estados do subpedido; resolução da cidade pelo domínio.
- **Playwright** (`npm run test:e2e`), em 390 px e 1440 px, contra o build de produção em modo demo: compra completa em duas lojas com cadastro (LGPD) e Pix; bloqueio fora da área; comprador nunca vê saldo; todo anúncio com "Patrocinado"; isolamento entre cidades; painel (avanço de pedido, loja visível, reserva de estoque, lances e teto de 4 semanas).
- **Acessibilidade automática** (axe, WCAG 2.1 AA) nas principais páginas: falha em violação grave ou crítica (contraste, rótulos, nomes de botões). No celular, checa alvos de toque de 44 px na página de produto. Não substitui o teste manual com leitor de tela.

### 13.7 Plano de migração (etapas, com aprovação ao fim de cada uma)
1. Estrutura do projeto Next, tokens, white label, infra Docker. **[FEITO]**
2. Layout do comprador (cabeçalho, categorias, rodapé, barra inferior, cookies, sacola lateral, modal de localização) e home. **[FEITO]**
3. Categoria, produto, loja, lojas, busca e ofertas. **[FEITO]**
4. Sacola, checkout, pedido, entrar, cadastro, conta, termos, privacidade e vender. **[FEITO]**
5. Painel do lojista e central de anúncios. **[FEITO]**
6. PWA (manifest por cidade, ícones, service worker) e testes (Vitest + Playwright). **[FEITO]**
7. Catálogo: mega menu com subcategorias, filtros laterais, galeria com fotos e vídeo, kits aberto e fechado. **[FEITO]**
8. Pós-compra: chat por subpedido e área de downloads de produtos digitais. **[FEITO]**
9. Lojista: editor de produto completo e logística da loja. **[FEITO]**
10. Administração da plataforma (`/admin`). **[FEITO]**

### 13.8 Catálogo ampliado (etapa 7)
- **Subcategorias:** cada categoria tem subcategorias (`Categoria.subcategorias`, `Produto.subcategoriaId`). No desktop, o botão "Categorias" abre um **mega menu**: categorias à esquerda, subcategorias da categoria em foco à direita, mais atalhos para Ofertas e Lojas. Na página da categoria, chips "Todas · Camisaria · …" filtram por `?sub=`.
- **Filtros laterais** (categoria, busca e ofertas): botão "Filtros" abre um painel (direita no desktop, de baixo no celular) com faixa de preço, marca, loja e característica, com a contagem de cada opção. Tudo vai para a URL (`marca=`, `loja=`, `car=`, `min=`, `max=` em reais) e o servidor filtra; os filtros aplicados aparecem como chips removíveis. Trocar a ordenação mantém os filtros. **[PROPOSTA]** O filtro "cidade" do protótipo anterior não entrou: cada cidade é um domínio e nenhuma consulta cruza cidades (§2).
- **Galeria do produto:** até 20 mídias (`MAX_MIDIAS`) na ordem do lojista; fotos 4:5 (moda) ou 1:1 e vídeo em quadro 9:16; desliza no celular, setas e teclado no desktop, miniaturas e contador "3/6".
- **[DECIDIDO 19/11/2026] Fotos da demonstração:** cada produto fictício tem de 1 a 3 fotos ilustrativas reais.
    - Origem: fotografias do Unsplash e imagens geradas para produtos e embalagens fictícias. As imagens geradas ficam no projeto e não são baixadas pelo script do Unsplash.
    - Ficam no próprio projeto, em `public/produtos/<produto>-<n>.webp` (WebP, 800 px, 4:5 na moda e 1:1 nas demais), e são servidas pelo `next/image`; nada é carregado de site externo (CSP inalterada).
    - A lista de fotos por produto está em `src/mocks/fotos-mock.json`. O script `node scripts/baixar-fotos-mock.mjs` baixa as que faltarem.
    - `ArteProduto` mostra a foto quando há `Midia.url`; sem foto (produto novo no painel, fila de moderação da demo), continua o desenho da categoria.
    - O cartão usa a 1ª foto como capa, mesmo quando a 1ª mídia é vídeo. O vídeo da demo continua simulado, sobre a 1ª foto.
    - Para trocar uma foto: editar o JSON, apagar o arquivo e rodar o script.
- **[DECIDIDO 19/11/2026] Fotos nos anúncios da demo (H1, M1, M2, L1):** cada criativo tem `imagem` (`CriativoAnuncio.imagem`), a foto da arte do anunciante, também do Unsplash. Ficam em `public/anuncios/<vaga>-<tema>.webp`, no tamanho da vaga, e o mesmo JSON e script cuidam delas.
    - `FotoCriativo` põe a foto atrás do texto com um véu na cor de fundo do anunciante. No desktop o texto fica à esquerda e a foto aparece à direita (no L1, a foto em cima e o texto embaixo); no celular o véu cobre tudo para manter a leitura.
    - A foto é decorativa (`alt` vazio): o nome lido do link continua sendo o texto do anúncio, sempre com "Patrocinado" + anunciante.
    - Criativo sem `imagem` continua só com cor e texto, como antes. K1 segue mostrando o convite "Anuncie no topo de…" quando não há anunciante.
    - **[PENDENTE]** Na versão real, o anunciante envia a arte pela central de anúncios, ela passa pela moderação, e o contraste do texto sobre a foto precisa de checagem na moderação.
- **Vídeo como capa do cartão:** quando a 1ª mídia é vídeo, o cartão mostra o selo "Vídeo". Na versão real, vídeo mudo em loop, sem som automático, respeitando "reduzir movimento".
- **Kits (PRD-05):** pelo menos 2 produtos distintos da mesma loja; o kit não tem estoque próprio.
    - **Fechado:** composição fixa e preço próprio; a página mostra "O que vem no kit"; disponibilidade = a pior entre os componentes.
    - **Aberto ("monte o seu")** **[PROPOSTA]:** o comprador escolhe entre as opções (mínimo e máximo definidos pela loja); preço = soma dos escolhidos − desconto do kit (ex.: 10%), arredondado no fim. O cartão mostra "a partir de" (os itens mais baratos disponíveis). Escolhas diferentes viram linhas diferentes na sacola, que lista "Inclui: …".
    - **Estoque:** a demanda de kits e de itens avulsos é somada por produto (`demandaPorProduto`), base para a reserva no servidor.
- **Indisponível no cartão:** só o desenho fica apagado; o selo "Indisponível" mantém contraste.

### 13.9 Pós-compra (etapa 8)
- **Produtos digitais (PRD-15):** categoria "Livros e digitais" (e-books e moldes). `Produto.digital` traz formato (PDF, EPUB, ZIP) e tamanho.
    - **[PROPOSTA]** Sem frete e sem endereço: a loja só com itens digitais aparece no checkout como "Entrega digital · sem frete", e o bloco de endereço some quando a sacola é só digital.
    - **[PROPOSTA]** O CEP fora da área não bloqueia produto digital (não há entrega física).
    - O subpedido digital segue o fluxo realizado → pagamento confirmado → entregue (§5.6): ao confirmar o pagamento, o arquivo é liberado.
    - **[PROPOSTA]** Acesso: até 5 downloads em 30 dias, contados do pagamento (`acessoDownload` em `lib/regras/posVenda.ts`). Depois disso, o comprador fala com a loja.
    - A área fica em Conta › Downloads. Na versão real, "Baixar" pede ao servidor um link temporário e privado; o arquivo nunca fica em pasta pública. Na demonstração, baixa um `.txt` de exemplo.
- **Chat por subpedido (PRD-13):** uma conversa por subpedido, entre o comprador e aquela loja.
    - **[PROPOSTA]** Abre quando o pagamento é confirmado e continua aberto depois da entrega; antes disso, o pedido mostra "Conversa com a loja abre após o pagamento". Fechada em pedido cancelado.
    - Texto até 1000 caracteres e imagem JPG, PNG ou WebP de até 5 MB (§16). Aviso fixo: não compartilhar dados de cartão nem senhas.
    - Comprador: botão "Conversar com a loja" em cada subpedido (`/pedido/[id]/chat/[sub]`) e Conta › Conversas, com contagem de não lidas.
    - Lojista: Painel › Conversas, só as conversas da própria loja, com contagem de não lidas.
    - **Demonstração:** as conversas ficam salvas no aparelho e são vistas pelos dois lados no mesmo navegador. No modo demo, a loja responde sozinha depois de 1,5 s. A prévia da imagem não é guardada, só o nome e o tamanho.
    - **Back-end:** acesso só para quem participa do subpedido (tenant + dono), imagens em armazenamento privado com checagem do tipo real, mensagens em tempo real e trilha de auditoria. Equipe do lojista precisa da permissão "Pedidos" **[PENDENTE: matriz PO-07]**.
- **Testes da etapa 8:** Vitest (`posVenda.test.ts`) e Playwright (`e2e/posvenda.spec.ts`): compra de e-book sem endereço, download bloqueado antes do pagamento e contado depois, digital fora da área, chat com recusa de imagem grande e resposta da demo, e resposta do lojista no painel.

### 13.10 Editor de produto e logística da loja (etapa 9)
- **Editor de produto** em `/painel/produtos/novo` e `/painel/produtos/[id]` (o servidor confere se o produto é da loja). Seções: Informações, Tipo de produto, Fotos e vídeo, Preço e estoque. Regras em `lib/regras/produto.ts`.
    - **Informações:** nome (3 a 120 caracteres), categoria, subcategoria, marca, descrição (até 2000) e até 10 características (usadas nos filtros laterais).
    - **Tipos:** simples; com variações (nome da variação e ao menos 2 opções distintas, cada uma com **SKU e estoque próprios**); kit fechado ou "monte o seu" (≥ 2 produtos distintos da própria loja, sem estoque próprio, §13.8); digital (PDF, EPUB ou ZIP).
    - **SKU único por loja** (§8), também entre as opções de variação. GTIN/EAN opcional com dígito verificador.
    - **Aviso de preço comparado** (§16) só aparece com GTIN válido, porque a equivalência é pelo código, nunca pelo título. A faixa da demonstração é fixa.
    - **Galeria:** até 20 mídias, ordem por botões (antes/depois), a 1ª é a capa, texto alternativo obrigatório em cada mídia e ao menos uma foto além do vídeo.
    - **[PROPOSTA]** Limites de arquivo: foto JPG/PNG/WebP até 10 MB; vídeo MP4/WebM até 50 MB; arquivo digital até 200 MB.
    - **Prévia** do que o comprador vê ("Disponível" / "Últimas unidades", com a reserva de segurança), sem mostrar o número.
- **Moderação (§7.3):** ao salvar, a tela diz o que "vale na hora" e o que "vai para a moderação".
    - Preço, preço "de", estoque e estoque mínimo (inclusive o saldo de cada opção) valem na hora.
    - Nome, descrição, categoria, marca, características, mídias e **[PROPOSTA]** opções de variação, composição do kit e arquivo digital vão para análise. Até a aprovação, a vitrine mostra a versão publicada.
    - Aprovar o conteúdo **não restaura** preço nem estoque antigos (`aplicarAprovacao`).
    - Voltar o conteúdo ao publicado cancela a análise. Produto novo só aparece depois de aprovado. "Simular aprovação" só no modo demo.
    - Lista de produtos: Publicado, Alteração em análise ou Novo · em análise.
- **Logística (Painel › Minha loja, §7.4 e §16):** entrega e/ou retirada (ao menos uma), tarifa por km, frete grátis a partir de (custeado pela loja) e horário de corte. Regras em `lib/regras/logistica.ts`.
    - **[PROPOSTA]** Distância máxima de entrega entre 1 e 50 km (padrão 10 km) e tarifa até R$ 20/km.
    - **Trajeto de teste:** o lojista digita um CEP e vê distância, frete (com o mínimo de R$ 6) e se sai hoje ou amanhã pelo corte (hora de São Paulo). Também mostra se o CEP está fora da cidade, fora do raio ou sem entrega.
    - Na demonstração a distância é calculada a partir do CEP (estável, de 1 a 15 km). Na versão real é a rota pelas ruas.
    - O prazo só considera o corte; calendário e fórmula de prazo seguem em **[PENDENTE: PO-05]**.
    - **[PROPOSTA]** A vitrine do comprador ainda usa os dados fixos da loja; a distância máxima e o novo corte passam a valer para o comprador quando o back-end existir.
- **Unidades (PRD-02):** "Adicionar filial" pede nome, endereço, bairro, CEP e horário. A unidade entra **em análise** e só vende depois de aprovada ("Simular aprovação" no modo demo).
- **Correção:** no carregamento direto de uma página, o `usePathname` devolvia o caminho com a cidade (`/cianorte/painel/...`) e o menu do painel marcava "Visão geral". O hook `useCaminho` remove o segmento da cidade e é usado no menu do painel, na barra de categorias, na barra inferior e no modal de localização.
- **Testes:** Vitest (`produto.test.ts`, `logistica.test.ts`) e Playwright (`e2e/editor.spec.ts`). A checagem de acessibilidade (axe) passou a incluir o editor, Minha loja e Conversas.

### 13.11 Administração da plataforma (etapa 10)
- **Rotas `/admin/*`** com layout próprio (menu lateral com contagem de pendências), `noindex`. O service worker não guarda essas rotas em cache (versão do cache `ct-v2`).
    - Na demonstração a área é aberta, como o painel. Na versão real, só a sessão com papel **admin** entra, e cada rota `/v1/admin/*` confere o papel e o tenant no servidor.
    - Cada cidade tem a sua administração e nenhuma consulta cruza cidades (§2).
- **Toda decisão que nega, bloqueia, revoga ou muda regra exige motivo** e vai para a **Auditoria** (quem, quando, ação, alvo e motivo). **[PROPOSTA]** O motivo tem no mínimo 10 caracteres. Os registros não são editáveis.
- **Visão geral:** vendas pagas, comissão, lojas ativas, pedidos pagos e a lista de pendências.
- **Lojas e filiais:**
    - **Cadastros:** documentos de cada pedido de adesão. Sem cartão CNPJ e aceite do contrato, o botão "Aprovar" fica bloqueado. Reprovar exige motivo, e o lojista vê o texto.
    - **Lojas:** suspender (a vitrine some e os pedidos em andamento continuam) e reativar, ambos com motivo.
    - **Selo Loja oficial:** conceder só com registro de marca + cartão CNPJ + contrato social. Revogar exige motivo, e a vitrine personalizada volta ao padrão.
    - **Selo Indicada:** é automático; o admin só acompanha a situação (conquista com 100 pedidos em um dia, mantém com média de 100 por dia em 6 meses, perde na revisão).
    - **Filiais:** aprovar ou reprovar cada unidade.
- **Moderação:** produtos novos e alterações editoriais, com o que mudou, nome atual × proposto, descrição e prévia das mídias na ordem do lojista.
    - Aprovar publica sem mexer no preço e no estoque atuais (§7.3).
    - Reprovar mantém a versão publicada. O lojista vê "Reprovado pela moderação" com o motivo, no editor e na lista de produtos.
- **Pedidos:** todos os subpedidos da cidade, com situação do pagamento e da operação. "Colocar em análise" (com motivo) **bloqueia o avanço no painel da loja** (§5.6) até "Liberar" (com motivo). Pós-venda segue em **[PENDENTE: PO-04]**.
- **Financeiro:** repasse por loja: produtos, frete, comissão, taxa e líquido (`repasse` em `lib/regras/admin.ts`). A comissão incide só sobre produtos; a taxa do provedor incide uma vez sobre o valor cobrado.
- **Regras da cidade:**
    - A comissão (ilustrativa, PO-03) pode ser alterada com motivo, até **[PROPOSTA]** 30%. O financeiro do lojista passa a usar esse percentual.
    - Faixas de CEP, frete mínimo e taxa aparecem só para leitura.
    - Cupons e frete grátis da plataforma (PO-08), notificações por e-mail e WhatsApp (PO-09), vitrines globais da home e logística por transportadora aparecem como "Pendente".
- **Demonstração:** o admin e o painel conversam pelo aparelho, no mesmo navegador. O que o lojista da demo envia (cadastro, produto, filial) aparece para o admin, e as decisões voltam para o painel.
    - Decisões sobre as outras lojas e a troca de selo valem só nas telas do admin; a vitrine do comprador continua com os dados fixos até existir o back-end.
- **Testes:** Vitest (`admin.test.ts`) e Playwright (`e2e/admin.spec.ts`). A checagem de acessibilidade (axe) passou a incluir as 7 telas do admin.

### 13.12 Acesso, anúncios comprados e ajustes após a revisão do Codex (19/11/2026)
- **[DECIDIDO] Login em página própria**, como nos grandes marketplaces.
    - Rotas `/entrar`, `/cadastro` e `/lojista/entrar`, no grupo `(acesso)`: sem cabeçalho, categorias, rodapé nem barra inferior. O banner de cookies e os avisos continuam.
    - **[DECIDIDO 19/11/2026] Fundo:** imagem enviada pelo PO: o Cianorte Tem aberto no computador e no celular, numa mesa com caixas de pedido.
        - Arquivo: `public/acesso/vitrine-cianorte-tem.webp` (1536×1024), servido sem recompressão para ficar nítido.
        - Vem de `tenant.fundoAcesso`; cidade sem imagem fica com o fundo marinho da marca.
        - A ilustração original do Portal (`public/acesso/cianorte.svg`, sem a Catedral) fica guardada no projeto, sem uso.
    - **[DECIDIDO 19/11/2026] Layout (referência do PO):** foto em tela cheia sob véu marinho uniforme.
        - **Desktop:** à esquerda, marca, frase com o final em azul-claro ("Tudo o que <Cidade> tem, a um toque de você."), texto de apoio, 4 vantagens em cartões translúcidos (2 × 2) e selos (Pix, Cartão de crédito, LGPD, Parceria <associação>). À direita, o cartão com "Voltar para a loja", o formulário e "Ambiente seguro · Termos · Privacidade".
        - Cada tela (entrar, criar conta, lojista entrar e cadastro) tem frase e vantagens próprias.
        - **Celular:** a foto é uma faixa no topo com a marca, e o cartão vem logo abaixo; frase e vantagens não aparecem.
    - O cartão é branco sólido (o translúcido baixava o contraste das dicas dos campos, apontado pela checagem de acessibilidade).
- **[DECIDIDO] Painel exige login do lojista.**
    - Sem sessão, vai para `/lojista/entrar?next=<tela>` e volta para a tela pedida. "Sair do painel" fica no menu.
    - Na demonstração a sessão fica no aparelho (`stores/sessaoLojista.ts`) e qualquer e-mail válido entra na loja de exemplo. Na versão real, o middleware exige cookie httpOnly.
    - Testes do painel usam `entrarComoLojista` (`e2e/ajuda.ts`).
- **[DECIDIDO] Arte do anúncio só depois da compra**, vinculada à loja.
    - Fluxo da campanha (§9.3):
        - lance vencendo → aguardando arte (lance vencido) ou lance superado;
        - compra direta → aguardando arte;
        - aguardando arte → arte em análise → no ar ou arte reprovada;
        - com a arte reprovada, o lojista pode reenviar; sem reenvio antes do início do período, o valor é reembolsado.
    - "Enviar arte" aparece em Minhas campanhas e abre `/painel/anuncios/arte/[id]`. Antes da compra, a tela explica que não há espaço garantido.
    - **[PROPOSTA]** H1 só por lance; as demais vagas por compra direta pelo valor de tabela (`VagaAnuncio.modoCompra`). Vaga ocupada permite reservar o próximo período. Aguarda confirmação comercial.
    - **Editor da arte:**
        - dois tipos: "Foto + texto", em que o site monta título, apoio e botão, ou "Arte pronta", em que a imagem já traz o texto e o título vira texto alternativo;
        - imagem JPG, PNG ou WebP até 500 KB;
        - nitidez calculada pela ampliação necessária; **[PROPOSTA]** acima de 1,3× o envio é bloqueado;
        - zoom de 100% a 300%, posição horizontal e vertical por controles ou arrastando a foto na simulação;
        - efeito: véu neutro (padrão), degradê na cor da marca (com seletor de cor) ou sem efeito (só arte pronta);
        - destino do clique: a loja ou a categoria dela;
        - área segura de 40 px opcional;
        - prévia no computador com o MESMO componente da vitrine e recorte no formato do celular. Regras em `lib/regras/arteAnuncio.ts`.
    - **Moderação:** em Admin › Moderação, a seção "Artes de anúncio" mostra a prévia fiel; aprovar põe no ar e reprovar exige motivo (o lojista vê o motivo). Tudo vai para a auditoria e conta nas pendências.
- **Selo do anúncio unificado:** "Patrocinado" + logo (ou sigla na cor da loja) + nome da loja num só selo, em todas as vagas. Antes apareciam o selo e a marca com o nome repetido. Não é editável pelo lojista.
- **Desempenho:** as logos das lojas saíram do estado do painel para `stores/logos.ts` (`ct-logos-v1`). A vitrine não lê mais pedidos, campanhas e artes do painel a cada página. As logos salvas antes são trazidas uma vez. As logos do projeto passam pelo `next/image`; só as enviadas na demo (data URL) dispensam a otimização.
- **Testes:** Vitest (`arteAnuncio.test.ts`, `redirecionamento.test.ts`) e Playwright (`e2e/acesso.spec.ts`, `e2e/arte-anuncio.spec.ts`).
- **Build em pasta separada:** `NEXT_DIST_DIR=.next-testes npm run test:e2e` (ou `next build`) gera o build fora do `.next`. Assim um `next dev` aberto não corrompe o build (erro "no direct app page entry found for /_not-found"). As pastas `.next-*` ficam fora do Git e do Docker.

### 13.13 Preparação para a apresentação (19/11/2026)
- **[DECIDIDO] Apresentar com `npm run demo`** (na raiz): gera a versão de produção e abre em modo demonstração em http://cianorte.localhost:3000 (`npm run demo -- 3100` para outra porta; build em `.next-demo-<porta>`).
    - O `npm run dev` compila cada página na primeira visita e fica lento no Windows; ele serve só para desenvolver.
    - Medido: páginas entre 0,01 s e 0,14 s.
    - Varredura de 102 rotas e 164 imagens/ícones sem nenhum erro 500.
    - `/favicon.ico` (ícone da cidade) e `/robots.txt` foram incluídos; antes davam 404 no console.
- **[DECIDIDO] Cadastro do vendedor de verdade (na demo, salvo no aparelho):**
    - "Quero vender" leva a `/lojista/cadastro`: o lojista cria o acesso (loja, CNPJ com máscara e dígito, responsável, e-mail, celular, senha, termos) e segue direto para o painel.
    - `/painel/cadastro` virou um assistente em 6 etapas: empresa, responsável, unidade, recebimento, documentos e revisão.
    - Tem barra de progresso, validação por etapa e salvamento automático a cada alteração, retomando de onde parou.
    - Conexão simulada com o provedor de pagamento e anexos reais de documentos (PDF, JPG ou PNG até 5 MB; cartão CNPJ obrigatório).
    - Envio para análise; na demo, "Simular aprovação". Regras em `lib/regras/cadastroLoja.ts`.
    - Loja nova começa como rascunho e oculta, com o nome fantasia no menu e sem a logo da loja de exemplo.
- **[DECIDIDO] Atalhos de categoria da home em carrossel:** uma fileira só, com setas no computador quando não cabem.
- **[DECIDIDO] Letreiro de ofertas na barra do topo:** o botão "Categorias" (mega menu) continua. Os links de categoria e o "Mais", que repetiam os atalhos da home, deram lugar a um letreiro.
    - O letreiro intercala frases patrocinadas das lojas (com "Patrocinado" e a marca) e avisos da cidade.
    - Para com o mouse ou o foco, tem botão de pausa, e para quem pediu menos movimento no sistema a lista fica parada.
- **[PROPOSTA] Vaga T1 (letreiro):** só texto (até 80 caracteres) e destino do clique, compra direta, R$ 150 por dia, até 8 lojas revezando, em todas as páginas.
    - Aparece no mapa da central de anúncios. A "arte" é a frase, num editor próprio com prévia, e passa pela mesma moderação no admin.
    - Valor a confirmar com a tabela comercial.
- **Testes:** Vitest (`cadastroLoja.test.ts`) e Playwright (`e2e/vendedor.spec.ts`). Testes que procuravam textos que agora também aparecem no letreiro foram restritos ao conteúdo da página (`main`).

### 13.14 Responsividade sem rolagem desnecessária (19/11/2026)
- **Regra:** nenhuma página pode rolar na horizontal, de 320 px a 1920 px. Só tabelas e blocos largos rolam dentro do próprio cartão.
- **[PROPOSTA] Menu do painel e do admin no celular e tablet (< 1000 px):** vira uma barra compacta com a marca e um botão com o nome da tela atual, que abre o menu. Antes, o menu inteiro (cerca de 900 px) vinha antes do conteúdo em toda tela. O menu fecha ao trocar de tela.
- **Desktop:** o menu lateral fica fixo e nunca passa da altura da tela (rola dentro dele, se precisar). Os itens têm 40 px e os botões 36 px no desktop; no celular continuam com 44 px.
- Controles segmentados (filtros Todos/Em andamento…, unidades de tempo) quebram linha em vez de vazar.
- Células de tabela com 12 px de margem lateral (16 px a partir de 1100 px). Exemplos de código quebram linha.
- A janela de conversa ocupa a altura que sobra na tela (entre 360 e 640 px).
- Telas de acesso no celular: "Voltar para a loja" fica na faixa da foto, ao lado da marca, e o cartão sobe.
- **Como medir:** varredura de todas as rotas em 320, 360, 390, 768, 900, 1024, 1280, 1440 e 1920 px, procurando rolagem horizontal e rolagens internas que sobram poucos pixels.

### 13.15 Continuidade: ajustes desenvolvidos pelo Codex (22–23/11/2026)

**Autoria e finalidade:** os ajustes descritos nesta seção foram desenvolvidos pelo **Codex**, a pedido do responsável pelo produto, e este registro foi consolidado pelo Codex em 23/11/2026 para passagem de contexto ao Claude e a outros desenvolvedores. Isso não atribui ao Codex o desenvolvimento das seções históricas anteriores. As regras e decisões anteriores continuam válidas; esta seção descreve o estado e os limites da demonstração no momento do registro.

**Situação técnica geral**

- O repositório contém `apps/web` (Next.js 15, React 19, TypeScript, Tailwind CSS e Zustand). Não há `apps/api` implementado nem banco integrado. Os dados iniciais vêm de `src/mocks`, e várias alterações são persistidas no `localStorage` do navegador. O cliente HTTP em `src/lib/api/http.ts` é uma preparação, não uma API de produção já conectada.
- O projeto é uma demonstração: não confundir botões, dados persistidos localmente, valores fictícios ou exemplos de API com uma operação de marketplace pronta para produção. Outro navegador ou dispositivo não recebe automaticamente as alterações. A vitrine do comprador ainda usa dados mockados em partes que o painel altera localmente.
- A infraestrutura prevista permanece NestJS e PostgreSQL; autorização, persistência, transações, pagamentos, auditoria confiável, uploads, estoque, avaliação e isolamento por tenant precisam ser implementados ou validados no servidor.

**Categorias e subcategorias**

- A administração tem a rota `/admin/categorias`, implementada em `src/components/admin/CategoriasAdmin.tsx`, acessível pelo menu administrativo. O formulário permite criar e editar nome, descrição, ícone e proporção de imagem; há criação e edição de subcategorias dentro da categoria mãe. A exclusão pede confirmação.
- Nomes precisam ter pelo menos dois caracteres e são verificados contra duplicidade sem diferenciar maiúsculas ou acentos, dentro do escopo aplicável. IDs são gerados a partir dos nomes, com sufixo quando necessário; ao editar um nome o ID existente não muda, preservando URLs e vínculos.
- A demonstração impede excluir categorias vinculadas a produtos ou lojas, e subcategorias vinculadas a produtos, inclusive edições publicadas ou em análise disponíveis no estado local. O fluxo solicita reclassificar os itens; isso é uma verificação da demo, não integridade referencial no banco.
- `src/stores/categorias.ts` guarda listas por cidade em `ct-categorias-v1` no navegador. A lista editada alimenta o menu e a página de categorias, a vitrine e o editor de produtos no mesmo navegador. O cookie `ct-categorias-personalizadas` permite que uma URL de categoria nova chegue à renderização cliente; ele não contém o cadastro. Exclusão, publicação e validação devem passar para API/banco na versão real.
- Na tela administrativa, cada categoria mãe mantém cartão branco e menu de três pontos verticais no canto, com apenas Editar e Excluir. Subcategorias aparecem em cartões azul-marinho com texto e três pontos brancos, com as mesmas ações. O menu fecha ao clicar fora ou pressionar Escape; adicionar subcategoria continua disponível.
- Na vitrine, o bloco do título de todas as categorias usa o azul `marinho-2` do cabeçalho, título e descrição brancos e ícone sobre fundo branco. Mantém a largura original e o pesponto; o padrão está no componente compartilhado `PaginaCategoria.tsx` e vale também para categorias novas. O `tom` da categoria continua existindo como dado para outros usos.

**Publicidade, imagens e navegação**

- A home possui H1 em carrossel automático com até quatro anunciantes, navegação manual, pausa e respeito à preferência por movimento reduzido. Há carrosséis de produtos com navegação manual; os controles de filtros da categoria quebram linha para não ficarem cortados atrás da publicidade.
- Há layouts e mapas de publicidade separados para home e categorias. Na categoria, a vaga K1 fica abaixo do título e L1 fica na lateral, após a lista de lojas no desktop; no celular, L1 entra na grade. Os anúncios de demonstração de categoria usam lojas relacionadas à categoria, e o destaque adicional de móveis “Sala nova até o Natal” foi preservado. Uma categoria nova sem criativo disponível pode mostrar o convite para anunciar: a presença de uma imagem em uma categoria recém-criada não é automática.
- A compra de vagas, associação da loja à categoria, período, valores, disponibilidade e entrega de anúncios ainda exigem regras e persistência no backend. O pedido comercial mencionou que as vagas de categoria devem corresponder à atuação da loja e ao período contratado; não presumir que contratação simultânea de K1 e L1 esteja implementada. Os preços indicados em §9 são exemplos/propostas, não uma tabela comercial definitivamente aprovada.
- As marcas fictícias e imagens de anúncios/produtos da demonstração ficam em `public/marcas`, `public/anuncios` e `public/produtos`. O selo `MarcaAnunciante` mostra “Patrocinado”, logo ou sigla e nome, em fundo branco translúcido. As imagens dos criativos usam véu neutro por padrão; o degradê colorido continua configurável no editor. Algumas imagens do catálogo foram preparadas para representar produtos embalados ou objetos de loja; não substituir indiscriminadamente as fotos de moda.
- Em `/painel/cadastro`, `LogoCadastro.tsx` permite escolher, pré-visualizar, salvar e restaurar a logo da loja: JPG, PNG ou WebP, até 2 MB, reduzida no navegador para até 512 px e armazenada em `ct-logos-v1`, por cidade e loja. A logo aparece nas áreas conectadas da demonstração; o backend deve guardar e servir a imagem de forma persistente.

**Avaliações e métricas de loja**

- O comprador pode avaliar a loja em um subpedido pago e não cancelado, com nota inteira de 1 a 5 e comentário opcional de até 500 caracteres. Na demo é permitida uma avaliação por usuário e subpedido; o formulário e a regra estão em `AvaliacoesLoja.tsx` e `stores/comprador.ts`.
- Exibir separadamente média e quantidade de avaliações e quantidade de itens vendidos; vendas são contadas por unidade, não por valor financeiro. A demo combina os valores fictícios da loja com avaliações e itens de pedidos pagos locais não cancelados. Uma venda maior não comprova por si só que a loja é confiável.
- Avaliações, pedidos e contagens locais não são agregados entre aparelhos. O servidor precisa validar elegibilidade, impedir duplicidade, manter dados por tenant/loja e calcular as métricas reais.

**Estoque e integração**

- A tela `/painel/estoque` usa `GestaoEstoque.tsx` e possui modos Manual, Planilha e API aberta; o bloco de API aparece somente no modo API. A reserva de segurança continua configurável.
- No Manual, o botão Ajustar abre o formulário para alterar saldo e mínimo, incluindo saldo por opção em produtos com variações; é possível zerar quantidades e marcar a disponibilidade como pausada sem apagar o saldo. Ao retomar, o status depende do saldo, do mínimo e da reserva. O botão Adicionar produto leva ao cadastro já existente, e produtos novos físicos entram no estoque da demo.
- Em Planilha, o lojista seleciona um CSV com cabeçalhos `sku` e `quantidade`, separados por `;` ou `,`. Aceita BOM e campos entre aspas; a quantidade inteira não negativa substitui o saldo do SKU. Variações usam o SKU de cada opção. Há exportação de `estoque.csv` com SKU, quantidade e produto. SKU desconhecido, duplicado, ausente ou quantidade inválida impedem a aplicação do arquivo. Arquivo: `src/lib/regras/csvEstoque.ts`.
- As mudanças passam por `atualizarEstoque` em `stores/painel.ts` e são persistidas no navegador. A pausa manual é considerada na tabela de estoque e na lista de produtos do painel; isso ainda não garante bloqueio da compra nem atualização da vitrine em outros navegadores. Não há remoção definitiva de produto do catálogo nessa tela: zerar saldo ou pausar é diferente de excluir cadastro.
- A API aberta é apenas uma apresentação com exemplos de rotas e chave mascarada fictícia; não há integração externa, chave real, webhook funcional, histórico confiável nem controle transacional de reservas. A configuração de webhook é desabilitada na demonstração. As regras de estoque e segurança de §8 e §15 são requisitos futuros, não serviços já entregues.

**Carregamento, erros e ambiente de desenvolvimento**

- `src/components/ui/Carregando.tsx` exibe a marca da cidade no centro, pulsando suavemente sobre uma camada clara que desfoca a página. `role=status` e texto anunciam o carregamento; `prefers-reduced-motion` desativa a animação. É usado no fallback de rota `src/app/[tenant]/loading.tsx`, na hidratação do admin e do painel e na verificação da sessão do lojista. O `TenantProvider` no layout raiz fornece a marca também durante o fallback.
- `src/app/[tenant]/error.tsx` apresenta uma mensagem e o botão “Tentar novamente” para erros capturados pelo limite de erro da rota. Isso não cobre todos os erros possíveis, inclusive falhas que ocorram antes da montagem do React.
- A lentidão observada no Windows incluiu compilação na primeira visita pelo `next dev`, pouca memória livre e tentativas de rede para fontes. Houve também 404 de arquivos `/_next/static` quando duas instâncias de desenvolvimento disputaram a mesma pasta `.next`. Isso não prova que todos os problemas de desempenho ou recarga tenham a mesma causa.
- O Playwright usa `NEXT_DIST_DIR=.next-e2e`; `npm run demo -- <porta>` usa `.next-demo-<porta>`. Não iniciar dois builds/servidores que escrevam na mesma pasta, nem ocupar a mesma porta. `EADDRINUSE` na porta 3000 indica outro processo escutando; identificar o processo antes de encerrá-lo. A demo otimizada ainda requer um build bem-sucedido; desde a correção em §13.17, as fontes do projeto não precisam ser baixadas durante o build.
- Houve erro intermitente no navegador `Cannot read properties of undefined (reading 'length')`, apontando para `BarraCategorias`, após mudanças/recargas de desenvolvimento. Foram tentados `@refresh reset` e a separação da casca sem hooks do conteúdo interno. Em desenvolvimento, o layout também tenta desregistrar um service worker antigo de `/sw.js` e limpar caches `ct-v...` antes da montagem do React, recarregando uma vez se havia controle ativo; `RegistrarSW.tsx` complementa a limpeza. **A causa exata do erro relatado pelo usuário não foi confirmada**, e os testes em navegador isolado não comprovam que ele tenha desaparecido no perfil do usuário. Se reaparecer, coletar a pilha completa, versão do servidor, estado do service worker e requisições de arquivos estáticos antes de atribuir a causa ao Fast Refresh ou ao cache. Não limpar `localStorage` como solução genérica: há dados da demonstração ali.

**Validação registrada**

- `npm run verificar` passou na etapa de estoque/navegação: lint, checagem de tipos e 95 testes de regras. Em verificações posteriores, lint e typecheck também passaram conforme o escopo das alterações. Esses resultados são históricos, não substituem uma nova execução após outras mudanças.
- Playwright em celular e desktop cobriu criação/edição/exclusão de categorias e proteção de vínculos (`e2e/categorias-admin.spec.ts`), estoque manual por variação, pausa, criação de produto e importação/exportação CSV (`e2e/estoque.spec.ts`), navegação/reload e limpeza de service worker/cache simulado (`e2e/navegacao.spec.ts`). A recuperação com JavaScript antigo simulado foi testada, mas não é reprodução comprovada do erro específico do usuário.
- A tela de carregamento foi inspecionada visualmente em 390 e 1440 px, e foi verificado que a animação fica desativada com movimento reduzido. O cabeçalho azul das categorias foi conferido em desktop e celular. Após a inclusão da marca no carregamento, oito testes selecionados de categorias, estoque e navegação passaram nas duas resoluções.

### 13.16 Atributos e telas de acesso configuráveis (Codex, 23/11/2026)

- **Atributos:** o editor de produtos permite cadastrar pares de atributo e valor (por exemplo, `Material: Algodão`), além das características livres existentes. O nome e as opções da variação do produto também formam um atributo de filtro. São campos editoriais: alterações só entram na versão publicada após aprovação, seguindo a moderação de produto existente.
- Em cada categoria, as facetas são montadas a partir dos atributos e variações dos produtos publicados, agrupadas por nome; nomes e valores equivalentes não diferem por caixa ou acento, e cada produto é contado uma vez por opção. Dentro de um atributo, opções selecionadas funcionam como OU; entre atributos diferentes, como E. Os filtros são conservados na URL via parâmetros `at`, sem dividir valores que contêm vírgulas. Implementação: `lib/regras/atributos.ts`, `lib/filtros.ts` e `PainelFiltros.tsx`.
- Na demonstração, a categoria também combina o catálogo fictício com edições de produtos aprovadas e produtos novos aprovados no navegador, usando `lib/regras/vitrineLocal.ts` e `stores/painel.ts`. Produto novo ainda em análise não aparece nos filtros. A tela de detalhe local informa que a compra de um produto cadastrado no aparelho depende do servidor; não há integração de carrinho, checkout ou catálogo real para esses produtos. O comportamento não é compartilhado entre usuários e não substitui uma consulta/faceta do backend.
- **Telas de acesso:** Admin › Telas de acesso (`/admin/acesso`) configura separadamente entrada e cadastro de compradores e de lojistas. É possível editar títulos e textos da área de campanha e do formulário, tópicos e ícones, selos, cores da marca, fundo, véu, textos, cartões, formulário, botões e links. Há opção para mostrar textos, tópicos e selos no celular. A imagem de fundo aceita JPG, PNG ou WebP até 700 KB; a tela pode ser aberta para conferência depois de salvar.
- Cada tela pode ter banner opcional com imagem, título, descrição, link local ou HTTPS, identificação de patrocínio e anunciante, e datas de início/fim inclusivas (horário de São Paulo). A ativação é verificada no carregamento e periodicamente enquanto a tela está aberta. Uma campanha ativa patrocinada exige identificação do anunciante. O banner e o fundo são guardados como imagens locais; o limite de armazenamento do navegador pode impedir o salvamento.
- A configuração é salva em `ct-acesso-visual-v1`, por cidade e por tela, e existe opção de restaurar o padrão. É uma demonstração local: não há publicação compartilhada, armazenamento de mídia no servidor, agenda central, contratação, cobrança, aprovação comercial ou rotação entre campanhas. A versão real deverá implementar permissões de administrador, persistência, upload seguro, agendamento e contratação no backend.
- Testes de regras: `atributos.test.ts` e `acessoVisual.test.ts`. Jornadas: `e2e/configuracao-acesso-atributos.spec.ts`, incluindo configuração e banner, isolamento entre telas, atributos/variações após moderação e produto novo aprovado. Os resultados devem ser verificados novamente a cada mudança.

### 13.17 Fontes locais e build na Vercel (Codex, 23/11/2026)

**Implementação e assinatura: Codex**, a pedido do responsável pelo produto, em 23/11/2026. Esta seção complementa os ajustes e a autoria das seções 13.15 e 13.16.

- Durante uma tentativa de implantação na Vercel, o build falhou na etapa `next/font/google` relacionada à fonte Inter. O trecho de log fornecido mostrava a falha do carregador, mas não incluía a mensagem inicial completa; portanto, a causa exata da falha remota não foi confirmada. Antes da alteração, `next/font/google` buscava as fontes durante o build, introduzindo uma dependência de rede nessa etapa.
- Para eliminar essa dependência de download e preservar a identidade visual, o Codex incluiu as fontes variáveis oficiais **Inter** e **Outfit** em `apps/web/src/fonts/` e trocou `src/app/[tenant]/layout.tsx` para `next/font/local`. São mantidas as variáveis `--font-inter` e `--font-outfit`, `display: swap` e os pesos variáveis de 100 a 900. Não é necessário usar fontes externas no navegador ou baixar Google Fonts durante a compilação.
- Os arquivos `Inter-Variable.ttf` e `Outfit-Variable.ttf` vieram do repositório oficial Google Fonts. A documentação de origem está em `apps/web/src/fonts/README.md`, e as licenças SIL Open Font License 1.1 estão em `LICENSE-Inter.txt` e `LICENSE-Outfit.txt`; mantê-las ao redistribuir as fontes.
- **Validação local:** o build de produção foi executado com `NEXT_DIST_DIR=.next-verificacao`, `DEFAULT_TENANT=cianorte` e `NEXT_PUBLIC_DEMO_MODE=true`. A compilação, o lint, a checagem de tipos e a geração das 81 páginas foram concluídos com sucesso. Não há confirmação neste registro de que um novo deployment na Vercel tenha sido concluído; verificar o log e o commit do deployment real.
- **Configuração discutida para a Vercel:** repositório `AranhaLab/cianorte-tem`, diretório raiz `apps/web`, framework Next.js e comandos de build/instalação padrão. Para apresentação da demonstração, foram sugeridos `DEFAULT_TENANT=cianorte` e `NEXT_PUBLIC_DEMO_MODE=true`; esse modo ativa simulações e não torna o projeto pronto para uso comercial real. Não configurar API ou banco fictícios como se fossem serviços existentes.
- Os ajustes e a correção das fontes foram enviados à branch `feat/migra-front-next` do repositório `AranhaLab/cianorte-tem`; a correção das fontes corresponde ao commit `8af0076`. A Vercel só recebe a correção se o deployment usar um commit que a contenha. O envio anterior ao `origin` pessoal foi recusado por permissão, e o remoto local continuou apontando para `ViniciusAranhaQA/cianorte-tem`; conferir destino, branch e histórico atuais antes de enviar ou mesclar novamente.

**Assinado: Codex — implementação e documentação, 23/11/2026.**

### 13.18 Editor das telas de acesso com prévia ao vivo (26/11/2026)
- **[DECIDIDO pelo PO]** Admin › Telas de acesso virou uma lista das 4 telas (Entrada e Cadastro do comprador e do lojista), cada uma com "Personalizada" ou "Padrão", "Campanha no ar", **Editar com prévia** e **Abrir tela ↗**.
- **Editor em tela cheia** em `/admin/acesso/editor?tela=<tela>`, sem o menu lateral do admin (`EstruturaAdmin`):
    - Barra do topo: "Voltar ao admin", troca de tela, prévia em **Computador** (1440 × 900) ou **Celular** (390 × 844), situação ("Alterações não salvas" / "Tudo salvo"), "Abrir tela", "Restaurar padrão" (pede confirmação) e "Salvar configuração" (só com alterações).
    - Esquerda: as mesmas ferramentas de antes (§13.16), em blocos recolhíveis.
    - Direita: a **página de acesso real** num iframe do tamanho do aparelho, reduzida para caber. Cada alteração aparece na hora; nada vai para a tela real até salvar.
    - Sair, trocar de tela ou fechar a aba com alterações não salvas pede confirmação.
    - Celular e tablet (< 900 px): botões "Configurar" e "Prévia" alternam os dois painéis.
- **Como a prévia funciona:** o iframe abre `/entrar?previa=1` (ou a tela escolhida). A página avisa que está pronta e o editor manda a configuração em edição por `postMessage`, só para a própria origem (`lib/regras/previaAcesso.ts`, `hooks/usePreviaAcesso.ts`). Na prévia a página fica `inert` (só para ver) e o banner de cookies não aparece.
- **Segurança (§15):** só as 4 telas de acesso com `?previa=1` podem ser abertas num iframe, e só pela própria origem (`X-Frame-Options: SAMEORIGIN` e `frame-ancestors 'self'`). Todo o resto continua com `DENY` / `'none'`.
- O banner ligado mas fora do período aparece na prévia como fica hoje (oculto), com um aviso no editor.
- **Testes:** Vitest (`previaAcesso.test.ts`) e Playwright (`e2e/configuracao-acesso-atributos.spec.ts`: abre o editor sem menu lateral e confere a prévia mudando antes de salvar).

## 14. Infraestrutura **[DECIDIDO 18/11/2026]**

- **Servidor:** uma VPS. **Tudo roda em Docker** (front, back, banco e serviços futuros). Qualquer máquina sobe o ambiente inteiro com `docker compose`, o que facilita trocar de máquina ou receber um novo desenvolvedor.
- **Serviços** (`docker-compose.yml`):

| Serviço | Imagem | Exposto à internet | Observação |
| --- | --- | --- | --- |
| `proxy` | Caddy 2 | Sim (80/443) | HTTPS automático (Let's Encrypt) para os domínios de cada cidade. Repassa o host intacto. |
| `web` | `apps/web/Dockerfile` | Não | Next standalone, usuário sem root, sistema de arquivos só leitura. |
| `api` | `apps/api/Dockerfile` (fase 2) | Não | NestJS. Entra no mesmo domínio em `/api` (sem CORS, cookie first-party). |
| `db` | Postgres 17 | **Nunca** | Volume persistente `pg_data`. Acesso administrativo só por túnel SSH. |

- Comandos: só o front com `docker compose up -d --build web proxy`; com back-end com `docker compose --profile backend up -d --build`.
- **Pendências:** provedor da VPS, backup automático do Postgres (dump diário fora da VPS + teste de restauração), monitoramento/alertas, CI/CD (build da imagem e deploy) **[PENDENTE]**.
- Certificado coringa (`*.cianortetem.com.br`) exige desafio DNS no Caddy. Enquanto isso, cada domínio entra em `DOMINIOS_WEB` **[PROPOSTA]**.

## 15. Segurança

**Já aplicado no front:**
- Cabeçalhos em todas as rotas: CSP, HSTS, `X-Frame-Options: DENY` (exceção: prévia das telas de acesso, só pela própria origem, §13.18), `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP. `X-Powered-By` removido.
- A CSP é estática para manter o cache por cidade (ISR). Por isso `script-src` aceita `'unsafe-inline'`, que o Next exige sem nonce. **[PROPOSTA]** Reavaliar nonce quando o checkout for implementado.
- Dependências sem vulnerabilidades conhecidas (`npm audit` = 0). O `postcss` interno do Next foi forçado para a versão corrigida via `overrides`.
- Container: imagem mínima (alpine), usuário sem root, `read_only`, `cap_drop: ALL`, `no-new-privileges`, healthcheck.
- Segredos: só em `.env` (fora do Git). Variáveis `NEXT_PUBLIC_*` vão para o navegador, então **nunca** contêm segredo.
- Painel com `noindex`.

**Regras para o back-end e para as próximas etapas:**
- **Sessão:** cookie `httpOnly`, `Secure`, `SameSite=Lax`, emitido pela API. **Nunca** token em `localStorage`. Proteção CSRF nas rotas que alteram dados.
- **Autorização por recurso no servidor** (PRD-01): todo acesso confere tenant + dono. O front esconder um botão não é segurança.
- **Senhas:** Argon2id (ou bcrypt com custo ≥ 12), limite de tentativas e bloqueio progressivo no login, recuperação por link de uso único.
- **Pagamento:** cartão tokenizado no SDK do provedor (PCI). Número e CVV nunca passam pelo nosso servidor. Webhook com assinatura verificada e idempotente.
- **API de estoque:** chave por loja guardada só como hash, `Idempotency-Key`, rate limit (60 req/min), HMAC nos webhooks de saída.
- **Entrada:** validação de esquema em toda rota (DTO), consultas parametrizadas (ORM), upload com checagem de tipo real e tamanho e armazenamento fora da pasta pública.
- **LGPD:** criptografia em repouso para CPF e dados sensíveis, logs sem dados pessoais, registro de consentimento, trilha de auditoria de ações sensíveis.
- **Operação:** firewall da VPS liberando só 22 (com chave SSH, sem senha), 80 e 443; atualizações automáticas de segurança do SO; `npm audit` e atualização de imagens no CI.

## 16. Incorporado da revisão do protótipo "Tem Logo Ali" (18/11/2026)

O protótipo anterior (pasta `Marketplace-Local`, v0.16, com 26 documentos) foi revisado. Estes pontos dele entraram no Cianorte Tem:

- **Primeira visita:** um modal pede "Onde você quer receber?" (cidade + CEP da rua), sem bloquear a navegação. A escolha fica guardada no aparelho e preenche o endereço no cadastro.
- **Adicionar rápido:** botão "+" no card. Produto com variação leva à página do produto para escolher a opção.
- **Sacola lateral:** abre ao adicionar, agrupada por loja, com subtotal e atalho para fechar a compra.
- **Frete grátis por loja:**
    - **[PROPOSTA]** cada loja define um valor mínimo (ex.: R$ 120, R$ 150, R$ 199);
    - a sacola mostra "Faltam R$ X para frete grátis nesta loja" com barra de progresso;
    - o custeio do frete grátis é da loja;
    - regras globais de cupom e frete grátis da plataforma: **[PENDENTE: PO-08]**.
- **Faixa utilitária no topo** (desktop): "Seu comércio também tem lugar aqui — Quero vender" e "Painel do lojista".
- **Painel → Financeiro:**
    - mostra vendas, comissão, taxa de pagamento, líquido, disponível e a liberar, com o extrato por pedido;
    - o frete não paga comissão;
    - os percentuais usados (10% e 2%) são ilustrativos.
- **Painel → Vitrine da loja:**
    - **só para lojas Oficiais e Indicadas**;
    - módulos ordenáveis: banner horizontal, mosaico (até 4 imagens), produtos em carrossel, produtos em grade, categorias da loja e vídeo vertical;
    - sem HTML, CSS ou JavaScript;
    - se a loja perder o selo, a página volta ao padrão e os módulos ficam guardados;
    - mídias passam por moderação.
- **Painel → Equipe:** cada pessoa tem login próprio e permissões por área (Pedidos, Produtos, Estoque, Financeiro, Anúncios, Equipe). Ações sensíveis ficam na auditoria.
- **Aviso de preço comparado** (doc 08 do protótipo):
    - ao digitar o preço, a loja vê se está abaixo, dentro ou acima das ofertas equivalentes de **todo o marketplace**, sem frete;
    - o aviso é só informativo: não bloqueia nem reajusta;
    - equivalência por GTIN/EAN validado, nunca só pelo título.

**A trazer nas próximas versões** (já existem no protótipo anterior):
- **Área de Administração:** sellers e filiais, aprovação de produtos com prévia das mídias, pedidos globais, financeiro, pagamentos, logística, cupons, notificações por e-mail/WhatsApp, selos, vitrines globais da home, regras de CEP/comissão e auditoria.
- **Chat pós-compra:** imagens de até 5 MB.
- **Área de downloads** para produtos digitais.
- **Logística da loja:** distância máxima, trajeto de teste e horário de corte.

**Divergência a resolver:** o doc 09 do protótipo anterior fala em "mais de 200 pedidos em um dia" para o selo Indicada. O PRD v0.2 (mais recente) fala em 100. Este projeto segue o **PRD (100)** até decisão do PO.

## Agent Harness — modo supervisionado (adicionar ao final do CLAUDE.md existente)

- Antes de alterar código, consulte as decisões e regras vigentes neste documento; preserve distinções `[DECIDIDO]`, `[PROPOSTA]` e `[PENDENTE]`.
- Para tarefas novas ou alterações de comportamento, apresente plano curto com arquivos, critérios de aceite, testes e riscos; aguarde aprovação do escopo. Depois da aprovação, implemente e corrija dentro do escopo.
- Solicite aprovação específica antes de instalar dependências, alterar contratos, permissões, autenticação, isolamento por tenant, dados pessoais, pagamentos, migrar banco, executar operações destrutivas, fazer push/merge ou deploy.
- Utilize `.claude/skills/marketplace-workflow/SKILL.md` como procedimento operacional.
- Delegue QA e revisão independente após mudanças funcionais; acione Security Review para fluxos sensíveis.
- Execute os quality gates disponíveis; reporte comandos, resultados e verificações não executadas. Não confunda testes com mocks com validação de produção.
- Não altere funcionalidades fora do escopo aprovado nem declare backend real sem evidência.
- Entregue resumo de alterações, testes, riscos e decisões pendentes.
