---
name: marketplace-workflow
description: Use ao planejar, implementar, testar ou revisar mudanças no marketplace Cianorte Tem.
---
# Fluxo supervisionado
1. Ler `CLAUDE.md` e identificar decisões `[DECIDIDO]`, `[PROPOSTA]`, `[PENDENTE]` aplicáveis. Não converter propostas em requisitos.
2. Identificar arquivos, dependências, risco, critérios de aceite e testes existentes.
3. Para tarefa nova ou alteração de comportamento, apresentar plano e obter aprovação do escopo antes de implementar. Dentro do escopo aprovado, pode codificar, testar e corrigir sem pedir aprovação a cada arquivo.
4. Exigir aprovação específica para dependências, mudanças de contrato, autenticação/autorização, dados pessoais, tenant, pagamentos, migrações, operações de banco, comandos destrutivos, deploy, push ou merge.
5. Acionar QA e Code Review após implementação; acionar Security Review para fluxos sensíveis.
6. Executar quality gates adequados. Diferenciar testes não executados de testes aprovados.
7. Entregar resumo de diff, evidências, pendências, riscos e decisões abertas.

# Estado do produto
O frontend Next.js usa mocks e estado local; backend NestJS/PostgreSQL é planejado, não comprovadamente implementado. Não declarar prontidão de produção com base em testes demo.
