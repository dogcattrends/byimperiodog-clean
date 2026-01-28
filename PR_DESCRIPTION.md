Resumo das mudanças (PR automático gerado pela automação)

Objetivo
- Deixar o repositório testável e pronto para CI: ajustar encodings, tornar testes Vitest reproduzíveis, adicionar campos editoriais no Sanity e melhorar template de posts.

Mudanças principais
- Correções de encoding e fluxo de testes (UTF-8 safe)
- `tests/setup/test-env-utf8.ts`: setup global Vitest (React global + jest-dom)
- Sanity: `studio/schemas/post.ts`, `studio/schemas/author.ts` adicionados
- `app/blog/[slug]/page.tsx`: TL;DR, Key Takeaways, TOC, JSON‑LD
- Páginas de autor e hub de tópicos; componente `RelatedByTopic`
- `src/lib/uploadValidation.ts`: rejeita GIFs explicitamente
- `scripts/seo-audit.ts` e `package.json` script `seo:audit` implementados
- CI: workflow `.github/workflows/seo-audit.yml` adicionado (non-blocking)
- Dependências: alinhei `@tiptap` para v3 e removi `novel` que trazia @tiptap v2
 - `scripts/dev-no-interactive.mjs`: wrapper non-interactive para `npm run dev` (resolve caminhos no Windows, escolhe porta livre e inicia Next em background)

Testes e validação
- Vitest local: 36 arquivos, 226 testes passaram
- `npm ci` executado e dependências instaladas

Run local (non-interactive)
- Comando: `npm run dev:no-interactive` — gera `dev-noint.log` e inicia Next em background numa porta livre (imprime porta no log). Se quiser rodar em porta fixa use `PORT=3000 npm run dev:no-interactive`.

Build status
- `npm run build`: testado localmente — o `prebuild` e Contentlayer executaram, mas o `next build` falhou com erros de compilação:
	- Import/Server-only: `src/lib/ai/leadAdvisor.ts` contém `import "server-only"` e está sendo importado por componentes que acabam compilados em contexto não-server; revisar usos para garantir que só seja importado por Server Components.
	- Módulo não encontrado: `../ui/AdminErrorState` (ver caminho em `app/(admin)/admin/(protected)/leads/[id]/page.tsx`).

Próximos passos recomendados
- Corrigir os imports server-only ou mover a lógica para um arquivo que seja exclusivamente Server Component.
- Corrigir o caminho/arquivo `AdminErrorState` ou ajustar o export/import.
- Depois disso rodar `npm run build` novamente.

Pendências conhecidas
- `npm run dev` local inicia, mas há um prompt interativo ("Deseja finalizar o arquivo em lotes (S/N)?") que precisa de investigação - possível interação com PowerShell/OneDrive/antivírus.
- Sanity: validação de unicidade de slug/title não aplicada (recomendado implementar `Rule.custom` ou checks externos).
- Ajustes de performance (Etapa 6) não implementados.

Como revisar
- Ver commits no branch `ci/green-tests-encoding-setup`.
- CI rodará o `seo-audit` com `continue-on-error: true` (configurar secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` no repo para tornar audit útil).

Ação sugerida
- Revisar PR e executar CI. Se quiser, eu investigarei o prompt interativo localmente em seguida.
 - Revisar PR e executar CI. Eu já corrigi o wrapper non-interactive e posso abrir um follow-up PR com correções de build caso autorize.
