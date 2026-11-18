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

- Cada cidade é um **tenant** com: `slug`, `nome`, `marca`, `uf`, `cepPadrao`, `acento` (cor da etiqueta "Tem"), `associacao`, `slogan`, `cepsAtendidos` e domínio/subdomínio.
- Iguais em todas as cidades: layout, tipografia, marinho, azul de ação, neutros, verde de "loja local", pesponto e etiqueta.
- Muda por cidade: nome, cor do acento (tirada da bandeira da cidade), associação parceira, textos institucionais e base de CEPs.
- No front, essa configuração está em `window.CITY` (`js/data.js`). No back-end, ela deve vir de `GET /v1/tenant` resolvido pelo domínio.
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

## 13. Front-end atual (protótipo)

- **Estrutura:** HTML/CSS/JS **sem build**, SPA com rotas por hash (`#/`, `#/c/:cat`, `#/p/:id`, `#/sacola`, `#/checkout`, `#/painel/...`), estado em `localStorage` só para a demonstração.
- **Arquivos:**
    - `js/data.js`: dados de demonstração e configuração da cidade;
    - `js/app.js`: rotas, telas e eventos;
    - `css/styles.css`: tokens e componentes;
    - `manifest.webmanifest` + `sw.js`: PWA.
- **Migração para a stack definitiva [PENDENTE: stack]:**
    - cada função `vXxx()` de `app.js` vira uma página ou rota;
    - `pcard`, `rail`, `adStrip`, `storeCard`, `shopLayout` e `panelLayout` viram componentes;
    - `data.js` vira chamadas aos endpoints da seção 11;
    - os tokens de `:root` viram o tema.
- **Simulações da demo:** "Simular pagamento" e "Simular aprovação" existem só para demonstração e devem sair na versão real.

## 14. Incorporado da revisão do protótipo "Tem Logo Ali" (18/11/2026)

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
- **Kits aberto e fechado.**
- **Mega menu com subcategorias.**
- **Vídeo como capa do card** e galeria com fotos e vídeos ordenáveis (até 20 mídias).
- **Filtros em painel lateral:** marca, cidade, loja, característica e faixa de preço.
- **Logística da loja:** distância máxima, trajeto de teste e horário de corte.

**Divergência a resolver:** o doc 09 do protótipo anterior fala em "mais de 200 pedidos em um dia" para o selo Indicada. O PRD v0.2 (mais recente) fala em 100. Este projeto segue o **PRD (100)** até decisão do PO.
