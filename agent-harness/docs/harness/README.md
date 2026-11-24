# Harness v1 — implantação supervisionada

Este pacote é um **overlay**, não substitui arquivos existentes. Baseado no relatório estático de 23/11/2026; o repositório não foi acessado diretamente para gerar este pacote.

## Instalação segura
1. Criar branch dedicada e confirmar `git status` limpo.
2. Comparar os arquivos deste pacote com os existentes; **não sobrescrever** `.claude/settings.json`, agentes, skills ou workflows existentes.
3. Copiar apenas arquivos novos ou mesclar manualmente diferenças.
4. Acrescentar ao final do `CLAUDE.md` existente o conteúdo de `CLAUDE_APPEND.md`; não substituí-lo.
5. Verificar `package.json`, lockfile npm e compatibilidade com Node 20 antes de habilitar o workflow.
6. Executar lint/typecheck/test/build localmente; depois verificar E2E em ambiente demo isolado.
7. Criar PR e revisar o diff antes de merge. Configurar branch protection no GitHub separadamente.

## Atenção
- `.claude/settings.json` contém apenas negações de leitura de arquivos de ambiente conhecidos; não é sandbox nem proteção completa contra exfiltração. Configure permissões de execução, isolamento e aprovação humana no Claude Code.
- `quality.yml` pressupõe `package-lock.json` na raiz e npm workspaces compatíveis. Se usar outro gerenciador ou lockfile, adaptar antes de habilitar.
- Não inclui hooks automáticos inicialmente: evitar bloqueios/execuções inesperadas até validar scripts, versão do Claude Code e políticas locais.
- O workflow não faz deploy nem executa migrações.
- `CLAUDE.md` permanece fonte de verdade para regras de produto, mas suas propostas/pendências não são decisões aprovadas.
