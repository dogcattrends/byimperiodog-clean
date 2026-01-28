# Preflight Execution Plan

Objetivo: garantir que o ambiente local execute os mesmos comandos do CI antes de um deploy na Vercel.

## Comandos cobertos
1. `npm ci`
2. `npx contentlayer build` *(aplicável quando `contentlayer.config.*` estiver presente)*
3. `npm run check:all` — empacota `npm run typecheck`, `npm run lint`, `npm run test`, `npm run check:encoding`, `npm run check:banned-words`, `npm run check:supabase-content`, `node scripts/a11y-contrast.mjs` e `node scripts/verify-cache-headers.mjs` em sequência. O script aborta no primeiro erro detectado e propaga o `exitCode`.
4. `npm run seo:audit`
5. `npm run build`

## Procedimento
1. **Preparar ambiente**
 - Feche editores/terminales que possam travar binários (`resolver.win32-x64-msvc.node`).
 - Execute `npm ci` manualmente até completar; uma falha por EPERM no Windows geralmente indica que um arquivo está em uso.
2. **Rodar preflight**
 - Execute `npm run preflight`. O script dispara `npm ci`, gera o conteúdo do Contentlayer quando necessário, executa `npm run check:all`, `npm run seo:audit` e `npm run build` na ordem definida.
 - A execução é interrompida no primeiro erro detectado, portanto qualquer etapa com `FAIL` implica em bloqueio do deploy.
 - O resultado é salvo em `reports/preflight-<timestamp>.json`.
3. **Analisar relatório**
 - O JSON contém `status`, `durationMs`, `stdout`, `stderr` e `exitCode` para cada etapa, além da flag `success`.
 - Como o preflight trava no primeiro erro, etapas posteriores aparecem no relatório com `status = FAIL` e `exitCode = null` quando o binário não foi executado.

## Requisitos para sucesso
- `npm ci` deve concluir sem erros para garantir `next`, `tsc`, `vitest`, `tsx` e binários nativos registrados.
- O script funciona em Windows (PowerShell) e Linux porque usa `child_process.spawnSync({ shell: true })`.
- Se qualquer comando falhar, corrija o problema antes de reexecutar.

## Próximos passos do plano maior
1. Validar que o preflight roda limpo e que `check:all`, `seo:audit` e `build` devolvem `OK`.
2. Prosseguir com o item B do briefing (tipagem Sanity/admin/etc.) em um novo PR isolado.
