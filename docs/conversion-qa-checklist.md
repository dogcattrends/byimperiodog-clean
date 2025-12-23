# Conversion + A11y Sprint QA Checklist

## / (Home)
- [ ] Em `hero` com apenas 2 CTAs: `Ver filhotes premium` e `Baixar o guia do tutor`; ambos abrem as rotas corretas usando `PrimaryCTA`.
- [ ] TrustBlock aparece abaixo do hero (título + 4 itens) reforçando proof/process.
- [ ] O grid de filhotes continua carregando com `PuppiesGridPremium` e exibe skeleton antes dos cards (sem layout shift).

## /filhotes
- [ ] Há um único `h1` convincente acima do TrustBlock.
- [ ] Cada card mostra apenas uma CTA (`Quero esse filhote`), sem preço e sem CTA extra.
- [ ] Clique em `Quero esse filhote` abre o modal carregado via import dinâmico; o foco vai para a modal e volta ao botão ao fechar.
- [ ] O modal tem TOC, TrustBlock, RelatedLinks e CTA stack com ContactCTA adaptado (WhatsApp / telefone / copiar) e sticky CTA no mobile.

## /guia
- [ ] O formulário básico (Nome, WhatsApp, Email opcional, consentimento) valida client-side e mostra erros com `aria-describedby`.
- [ ] Após o envio bem-sucedido o formulário é substituído pela mensagem de sucesso e o botão `Baixar agora`.
- [ ] O botão de download dispara `pdf_download` (ver log via console ou `track.event` stub) e abre `/guia.pdf`.

## Tracking & eventos
- [ ] `cta_click` dispara meteado com `cta_id`, `location` e `device_mode` para os PrimaryCTA/ContactCTA principais.
- [ ] `modal_open` ocorre via card e `lead_submit`/`pdf_download` só após consentimento.
- [ ] Use `window.track?.event` stub ou console para verificar payloads durante cada ação.

## Acessibilidade
- [ ] Modais têm `aria-modal`, `role=dialog`, `focus trapping` (Radix) e ESC/close button.
- [ ] Formas usam labels associadas e mensagens de erro com `role=alert`.
- [ ] Botões e links têm outlines em foco e touch targets ≥ 44px.
- [ ] Prefers-reduced-motion respeitado por animações (framer-motion guardada).

## Melhoria incremental
- [ ] Confirme que `PuppiesGridPremium` mantém cache e filtros com status `aria-live`.
- [ ] Verifique a ausência de scripts extras na página principal (`PrimaryCTA` + `ContactCTA` reutilizados sem libs novas).

## Comandos úteis
- `npm run lint` (falha por issues já existentes em muitas rotas; foco no backlog).
- `npm run test` / `npm run build` (cobertura geral do monorepo).
