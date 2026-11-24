# Política de qualidade — Cianorte Tem

## Gates mínimos
- Lint, typecheck, testes unitários e build, usando scripts existentes na raiz.
- E2E Playwright em mudanças de rotas/jornadas, inicialmente sob execução supervisionada; integrar ao CI após validar ambiente e duração.
- Backend futuro: testes de API, isolamento por tenant, autorização por recurso, transações de estoque e idempotência.

## Classificação
- **Demo validada:** testes sobre mocks/estado local; não comprova operação real.
- **Integração validada:** APIs e banco reais testados em ambiente isolado.
- **Produção aprovada:** exige controles de segurança, observabilidade, backups e aprovação humana.

## Bloqueadores
- Falha de gate obrigatório.
- Mudança sensível sem Security Review.
- Ausência de aprovação para migração, deploy, dependências ou mudança de contrato.
- Requisito `[PENDENTE]` tratado como aprovado.

## Evidências de entrega
Arquivos alterados; objetivo; testes executados com resultados; testes não executados; riscos; decisão necessária; indicação clara demo/integração/produção.
