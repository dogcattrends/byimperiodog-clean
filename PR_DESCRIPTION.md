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

Testes e validação
- Vitest local: 36 arquivos, 226 testes passaram
- `npm ci` executado e dependências instaladas

Pendências conhecidas
- `npm run dev` local inicia, mas há um prompt interativo ("Deseja finalizar o arquivo em lotes (S/N)?") que precisa de investigação - possível interação com PowerShell/OneDrive/antivírus.
- Sanity: validação de unicidade de slug/title não aplicada (recomendado implementar `Rule.custom` ou checks externos).
- Ajustes de performance (Etapa 6) não implementados.

Como revisar
- Ver commits no branch `ci/green-tests-encoding-setup`.
- CI rodará o `seo-audit` com `continue-on-error: true` (configurar secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` no repo para tornar audit útil).

Ação sugerida
- Revisar PR e executar CI. Se quiser, eu investigarei o prompt interativo localmente em seguida.
