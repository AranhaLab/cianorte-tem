# Cianorte Tem

Marketplace regional white label (primeira cidade: Cianorte/PR). Monorepo com o front-end em Next.js e, na fase 2, o back-end em NestJS + PostgreSQL. Tudo roda em Docker.

Regras de negócio, estrutura e decisões: **`CLAUDE.md`**.

## Rodar o front em desenvolvimento

Requer Node 20.18 ou mais novo.

Na raiz do repositório:

```
npm install
npm run dev
```

O `npm install` da raiz instala também as dependências de `apps/web`.

Abra uma cidade pelo subdomínio:

- http://cianorte.localhost:3000
- http://maringa.localhost:3000 (cidade de teste do white label, sem lojas)
- http://cianorte.localhost:3000/dev/tokens (paleta e marca)

Crie `apps/web/.env.local` a partir do `.env.example` da raiz (`DEFAULT_TENANT` e `NEXT_PUBLIC_DEMO_MODE`).

## Rodar com Docker

```
cp .env.example .env
docker compose up -d --build web proxy
```

Com o back-end (fase 2): `docker compose --profile backend up -d --build`.

## Scripts (rodar na raiz)

Cada app tem o seu código e os seus testes na própria pasta (`apps/web` hoje; `apps/api` na fase 2). Os comandos da raiz repassam para o app; dentro de `apps/web` os mesmos comandos também funcionam.

| Script | O que faz |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint (inclui a regra "nenhuma cor fora dos tokens") |
| `npm run typecheck` | checagem de tipos |
| `npm run format` | Prettier |
| `npm test` | testes das regras de negócio (Vitest) |
| `npm run test:e2e` | jornadas de compra, painel e admin em 390 e 1440 px + acessibilidade (Playwright). Na primeira vez: `npm run test:e2e:instalar` |
| `npm run verificar` | lint + tipos + testes de regras (antes de subir) |

No Windows, o `npm run dev` pode corromper o cache `.next` quando várias páginas compilam ao mesmo tempo. Se aparecer "Unexpected non-whitespace character after JSON", apague `.next` e reinicie, ou revise com `npm run build && npm start`.

## PWA

O app é instalável ("Adicionar à tela inicial"). Nome, ícone e cor saem da cidade do domínio. O service worker só é ativado no build de produção (HTTPS ou localhost).

## Protótipo original

A versão HTML/CSS/JS original foi a especificação visual da migração e saiu do repositório em 19/11/2026. Para consultar: o protótipo original está no histórico do Git (commit cf1d609, branch feat/prototipo-front-end).

Todos os dados são fictícios.
