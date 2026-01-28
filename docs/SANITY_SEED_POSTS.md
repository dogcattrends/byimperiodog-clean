# Seed de artigos no Sanity (com imagem válida)

Este repo inclui um script para criar **3 posts iniciais** no Sanity com:

- `title` + `slug.current`
- `author` (reference)
- `publishedAt`
- `body` (Portable Text)
- `mainImage` (asset real no Sanity) — usado como capa de fallback pelo app

## Pré-requisitos

1) Um token com permissão de escrita no dataset (`SANITY_TOKEN`).

- No Sanity Manage: Project → API → Tokens → criar token com permissões de *Editor*.

2) (Opcional) Definir o autor:

- Por padrão, o script tenta resolver o author por nome: `SANITY_AUTHOR_NAME="By Império Dog Team"`.
- Se preferir, defina diretamente: `SANITY_AUTHOR_ID="<id-do-author>"`.

## Como rodar

O script carrega automaticamente `.env.local` (e `.env` se existir). Então, se o token já está no `.env.local`, basta rodar:

- `npm run sanity:seed-posts`

Se você preferir passar via terminal (PowerShell):

- `SANITY_TOKEN="<seu_token_aqui>" npm run sanity:seed-posts`

Opcionalmente, você pode setar variáveis para outro projeto/dataset:

- `SANITY_PROJECT_ID=mgw96j4i`
- `SANITY_DATASET=production`
- `SANITY_API_VERSION=2023-08-01`
- `SANITY_AUTHOR_NAME="By Império Dog Team"`
- `SANITY_AUTHOR_ID="<id-do-author>"`

## Resultado

- O script cria os posts como **drafts** (`drafts.*`). Para publicar, abra o Sanity Studio e clique em **Publish**.
- A imagem de capa é gerada como SVG e enviada como asset, então já fica “válida” para uso no frontend (`coverUrl` cai em `mainImage.asset.url`).

## Arquivo

- Implementação: scripts/sanity-create-posts.ts
