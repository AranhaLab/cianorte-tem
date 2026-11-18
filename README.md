# Cianorte Tem — protótipo front-end

Marketplace regional white label (primeira cidade: Cianorte/PR). Protótipo navegável, sem back-end.

## Rodar
Qualquer servidor estático na pasta:
```
npx serve .        # ou: python3 -m http.server 8080
```
Abra http://localhost:8080. No celular, "Adicionar à tela inicial" instala como PWA (o service worker só ativa em HTTPS ou localhost).

## O que tem
- Comprador (web + PWA): home com vitrines e anúncios, categorias, busca, loja, produto, sacola multiloja, cadastro com LGPD, checkout (entrega/retirada, Pix/cartão), pedido e conta com central de privacidade.
- Painel do lojista (`#/painel`): visão geral, pedidos, produtos, estoque com API aberta, minha loja (loja visível), cadastro e documentos.
- Anúncios (`#/painel/anuncios`): mapa de vagas, formatos, tempo (horas a 1 mês), valor de tabela e lances.

## Regras de negócio
Tudo em `CLAUDE.md`. Atualize-o a cada decisão.

Dados de `js/data.js` são fictícios. Botões "Simular pagamento" e "Simular aprovação" existem só para demonstração.
