# Harness v1 — implantação supervisionada

Este overlay adiciona agentes, uma Skill e quality gates sem substituir regras ou funcionalidades do marketplace.

## Instalação e manutenção
1. Revise `git status` e preserve alterações locais, inclusive o diretório-fonte `agent-harness/`.
2. Compare os arquivos do overlay com os destinos; mescle configurações existentes em vez de sobrescrevê-las.
3. Mantenha `CLAUDE.md` como fonte de regras de negócio e acrescente instruções operacionais sem remover seu conteúdo.
4. Revise o diff e a política de permissões antes de habilitar o harness.
5. Execute os quality gates locais quando as dependências já estiverem disponíveis. Instalar dependências requer autorização.
6. Execute E2E separadamente, em modo demo isolado; este workflow não faz deploy nem executa migrações.

## Configuração do projeto
- O monorepo usa npm, mas não declara npm workspaces.
- As dependências da aplicação e o lockfile correspondente estão em `apps/web/`; o workflow usa `npm ci --prefix apps/web`.
- Os scripts de lint, typecheck, testes unitários e build são invocados pelos wrappers da raiz.
- O build do Quality Gate usa `.next-verificacao`, já previsto no `tsconfig`, para não disputar a pasta `.next` de um servidor de desenvolvimento.
- `.claude/settings.json` nega leitura direta de alguns arquivos `.env`; isso não é sandbox nem impede leitura via shell. Revise as permissões e mantenha aprovação humana para comandos sensíveis.
- Hooks automáticos não são incluídos nesta versão.
- A proteção de branch deve ser configurada no GitHub separadamente.
