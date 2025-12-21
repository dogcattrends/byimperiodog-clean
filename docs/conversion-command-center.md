# Conversion Command Center

Este documento consolida o plano aprovado para elevar o `byimperiodog-clean` ao nível de plataforma premium com foco em **conversão**, **acessibilidade WCAG 2.2 AA** e **performance leve**. Considera as restrições (Server Components, zero duplicações, dependências mínimas) e define o que deverá ser monitorado antes/depois de cada sprint.

## 1. Conversion Blueprint (funil + CTAs)

| Rota | Objetivo | CTA primária | CTA secundária | Distrações a remover |
|---|---|---|---|---|
| `/` (Home) | Atrair atenção para filhotes + leads | “Ver filhotes premium” (PrimaryCTA) | “Falar agora no WhatsApp” (ContactCTA) | Sliders automáticos, blocos duplicados de CTA |
| `/filhotes` (listagem) | Abrir modal e captar intenção | “Detalhes” (PrimaryCTA, foco teclado) | “Enviar WhatsApp” (ContactCTA) | Banners pesados, filtros extras não essenciais |
| `/filhotes/[slug]` (modal) | Conectar com WhatsApp/telefone e copy | “Conversar no WhatsApp” (ContactCTA) | “Copiar telefone” (formField) | CTAs escondidos, descrições redundantes |
| `/blog` | Gerar tráfego para filhotes/guia | “Explorar guia” (PrimaryCTA) | “Ver filhotes relacionados” (RelatedLinks) | Links dispersos, stories difíceis de escaneamento |
| `/blog/[slug]` | Confiança, informações escaneáveis | “Ver filhotes” (PrimaryCTA) | “Baixar guia” (SecondaryCTA + lead form) | Ads terceiros, múltiplas CTAs iguais |
| `/guia` | Captura do lead magnet | “Receber guia” (PrimaryCTA) | “Baixar foto/resumo” (secundário) | Formulários longos, consentimentos duplicados |
| `/admin` | Operar conteúdo/leads | “Ver análises” | “Exportar leads” | Logs irrelevantes, modais pesados |

## 2. Auditoria UI/UX + A11y (P0/P1/P2)

### Severidade P0 (impacto direto conversão)
- **Modal de filhote**: foco não retorna ao botão; teclado perde a navegação (p0).  
- **CTA duplicado** em `/blog` (mais de 2 CTAs primários) criando indecisão.

### P1 (fricções e acessibilidade)
- **Todos os componentes CTA** não têm foco de alta visibilidade (outline).  
- **Forms** (lead magnet) ainda usam `aria-describedby` sem mensagens específicas.  
- **Pop-ups** sem `aria-modal` e sem `Esc` consistente.
- **Headings**: múltiplos H1 em páginas de blog e home create confusion.  
- **Contrast**: alguns botões no grid de filhotes quase sem diferença entre texto e fundo.

### P2 (melhorias incremental)
- **Microcopy** pouco instrutivo, sem promessa próxima ao CTA.  
- **Mobile**: touch targets menores que 44px (botões de filtros).  
- **Fonts** carregadas bloqueiam layout (serifas).  
- **Imagens** com layout shift em listagem inesperada.  
- **Tracking** com evento `modal_open` disparando em clique e scroll (duplicados).  
- **Performance**: carrega scripts adicionais para o modal mesmo em viewport pequeno (sem dynamic import).

## 3. Plano de mudanças (sprints curtos + rollback)

- **Sprint A (global)**: garantir landmarks (header, main, footer), atualizar header/footer (CTAs, nav), uniformizar PrimaryCTA + ContactCTA, adicionar skip+focus-visible, revisar tipografia/tokens.  
  *Rollback:* restaurar nav/header e remover skip link caso cause regressão.  
- **Sprint B (filhotes)**: refinar card → modal (lazy Modal acessível), CTA WhatsApp/call/copy, TrustBlock, ContentTOC, RelatedLinks, touch targets mobile.  
  *Rollback:* manter modal anterior e ativar logic fallback de `ContactCTA`.  
- **Sprint C (forms/guia)**: LeadForm UI (formField, validação acessível), mensagens de erro via `aria-describedby`, microcopy, Provas próximas, animar carga leve.  
  *Rollback:* voltar ao form clássico (submit básico) e resetar CTA.  
- **Sprint D (blog)**: inserir TL;DR, Key Takeaways, ContentTOC, RelatedLinks; garantir JSON-LD (Article + Breadcrumb + FAQ); CTA para filhotes/guia perto do conteúdo.  
  *Rollback:* desfazer blocos TLDR e voltar à versão base.  
- **Sprint E (observabilidade)**: tracking events (page_view, modal_open, cta_click, lead_submit, pdf_download). script `content-quality-audit`, smoke axe e QA checklist mobile/desktop.  
  *Rollback:* scripts auditáveis no CI com flag `--dry-run`.

## 4. Componentização estratégica (single source)

1. `PrimaryCTA` – padrão com `type="button"`, `aria-label` contextual, states focus/hover via tokens.  
2. `ContactCTA` – adapts mobile/desktop (WhatsApp vs telefone) com props `variant`, usa `useFocus` trap.  
3. `AccessibleModal` – dynamic import, focus trap, ESC, scroll-lock, aria-modal, returns focus.  
4. `FormField` – label, hint, error (aria-describedby), `prefers-reduced-motion`, inline validation hook.  
5. `TrustBlock` – carrossel de provas/processo, reuse across modal/blog.  
6. `ContentTOC` – parse headings, auto IDs, sticky behavior, focus.  
7. `RelatedLinks` – dedupe internal linking.

## 5. Padrões de acessibilidade

- Landmarks: `<header>`, `<main>`, `<nav>`, `<footer>` em todas as páginas.  
- Headings: máximo 1×H1; subsequentes H2/H3 em ordem.  
- Botões/links: bordas visíveis, rótulos, `aria-pressed` quando aplicável.  
- Modais: focus trap, ESC, scroll-lock, aria attributes.  
- Forms: `label`, `aria-describedby`, `role="alert"` em erros, validação amigável.  
- `prefers-reduced-motion`: animações reduzidas; `motion-safe` guard.  
- Touch targets ≥44px, `gap` entre CTAs.

## 6. Conversão inevitável

- 1 ação principal por tela (PrimaryCTA).  
- Microcopy direto (“ver detalhes”, “reservar”, “falar agora”).  
- Provas + processo (`TrustBlock`) adjacente ao CTA (ex: “Processo de adoção seguro em 3 passos”).  
- Evitar fricção: forms curtos (nome/email/consent), CTA claro e visível, modais com header + close.  
- CTA modal sempre presente; fallback textual e com `aria-live`.

## 7. Medição e QA

- **Eventos**: `page_view`, `modal_open`, `cta_click` (todas variações), `lead_submit`, `pdf_download`.  
- **QA checklist** (mobile/desktop viewports):
  - ☐ Skip link visível  
  - ☐ Headings corretos  
  - ☐ Modal focus trap + ESC  
  - ☐ CTA primária presente  
  - ☐ Formulário sinaliza erro  
  - ☐ Trusted block visível próximo ao CTA  
  - ☐ A11y smoke (axe) rodando  
- **Auditoria automatizada**: script `scripts/content-quality-audit.mjs` que percorre posts e verifica `author` + `tldr` + `takeaways` + canonical + JSON-LD + #links ≥2.  
- **Smoke axe**: Playwright + Axe no `/filhotes`, `/blog`, `/guia`.  
- **Gate**: lint/typecheck/build/test/seo:audit/perf:budget/perf smoke + `content-quality-audit`.

## 8. Relatório “antes/depois”

- A11y: comparar contagem de violações (axe) antes x depois.  
- Conversão: taxa de clique dos CTAs, modais abertos, leads capturados, downloads PDF (dados de eventos).  
- Performance: salário JS, TBT, CLS; `perf-budget` report + local tracking de layout shift.

## 9. Medição de impacto

- **Search Console**: monitorar impressões/top CTR via ingestão (legacy pipeline).  
- **Eventos de funil**: dashboard admin (posts de CTR baixo).  
- **Relatórios**: `reports/perf-budget.json`, `playwright-report`, `reports/seo-audit`.  
- **Checklist QA**: use `npm run test:smoke`, `npm run perf:budget`, `npm run seo:audit`.

> **Próximo passo**: Execução do Sprint A (global header/footer + PrimaryCTA/skip/landing). Deseja que eu já comece com os primeiros commits dessa sprint?  
