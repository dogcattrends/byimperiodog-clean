# Checklist de Acessibilidade - Admin

Objetivo: passos de teste manuais para validar acessibilidade do painel administrativo (AdminNav, Dashboard e formulários de Filhotes). Instruções em português com comandos para NVDA (Windows) e VoiceOver (macOS) e critérios de aceitação.

Sumário rápido
- Áreas principais: `AdminNav`, `Dashboard` (KPIs), formulário `Filhotes` (create/edit), `MediaManager`, diálogo de logout.
- Tipos de teste: teclado-only, leitores de tela (NVDA / VoiceOver), verificação visual de foco e preferências reduzidas de movimento.
- Resultado esperado: navegação sequencial por teclado acessível, mensagens dinâmicas anunciadas via `aria-live`, erros de formulário vinculados via `aria-describedby`, submenus com `role`/`aria-controls` corretos.

Ambiente
- Node/npm: executar `npm run dev` ou a build estática conforme necessário.
- Ferramentas de leitor de tela:
  - Windows: NVDA (https://www.nvaccess.org) - Atalho para iniciar/pausar NVDA: `Insert+Ctrl+N` (ou leia a documentação do NVDA).
  - macOS: VoiceOver - Ativar: `Cmd+F5` (ou `VO+F5`), navegação com `VO` (caps lock) modifiers.
- Recomendação: abrir o painel administrativo em uma janela só (ex.: /admin) e usar uma segunda tela/terminal para registrar resultados.

Comandos úteis (resumo)
- Start dev:
```bash
npm run dev
# ou para checar estático
npm run build && npm run start
```

- Lint e typecheck:
```bash
npm run lint --silent
npm run typecheck
```

Testes manuais (passo-a-passo)

1) Preparação
- Abra o painel admin em `/admin` com a conta de teste.
- Desative extensões que interfiram em teclado. Use janela do navegador em tamanho normal.
- Tenha NVDA ou VoiceOver pronto.

2) Teste teclado-only (todas as plataformas)
Objetivo: garantir que toda a navegação possível com mouse funcione também com teclado.

Passos:
- Focar a página (clique na área principal ou pressione `Tab` até o primeiro elemento focável).
- Percorra a barra de navegação superior (`AdminNav`) usando `Tab` e `Shift+Tab`.
  - Esperado: cada item recebe foco visível (outline/foco), os submenus abrem com `Enter`/`Space` e é possível navegar por itens internos com `Tab`.
  - No `details/summary` a interação com `Enter` ou `Space` deve expandir/colapsar.
- Testar CTA: `Novo filhote` e `Ver estoque` devem ser alcançáveis e acionáveis por Enter.
- Acessar o submenu `Filhotes / Estoque`:
  - Ao abrir, press `Tab` para navegar pelos links internos (`Listar`, `Novo filhote`, `Importar`, `Mídias`).
  - `Esc` deve fechar submenu (se aplicável). Se não fecha automaticamente, garantir que foco retorna para summary.
- Abrir o diálogo de `Sair` (Logout) via tecla e testar navegação com `Tab` dentro do dialog e usar `Enter` para confirmar/Cancelar.

Critérios de aceitação teclado:
- Todos os elementos acionáveis estão no fluxo de tabulação.
- Foco visível em todos os controles (borda ou anel de foco).
- Submenus acessíveis via teclado e com `role`/`aria-controls` corretos.

3) Teste com leitor de tela (NVDA / VoiceOver)
Objetivo: garantir que leitores de tela anunciem corretamente títulos, live regions e erros.

NVDA (Windows) passos:
- Iniciar NVDA.
- Usar `Tab` e `NVDA+Tab` para explorar e `Enter` para ativar.
- Verificar que o `summary` do submenu anuncia que é um botão expansível e indica estado (expanded/collapsed).
- Abrir `Filhotes` submenu e verificar que cada link é lido como `menuitem` (se marcado como tal) e que labels estão corretos.
- Ir ao `Dashboard` e observar KPIs (Leads hoje, Disponíveis). Ao recarregar a página (ou forçar atualização), NVDA deve anunciar mudanças nos KPIs devido a `aria-live="polite"`.
- Abrir formulário `Filhotes -> Novo` e tentar enviar sem preencher: leitor deve anunciar o erro global (status region) e foco deve pular para o primeiro campo com erro. O erro do campo deve ser anunciado (por `aria-describedby`).

VoiceOver (macOS) passos:
- Ativar VoiceOver (`Cmd+F5`).
- Use rotor e navegação por objetos/links para verificar menu e submenus.
- Verificar anúncio de `aria-live` e dos erros nos campos após tentativa de envio.

Critérios de aceitação leitor de tela:
- Submenu summary indica estado expandido/colapsado e announce role.
- KPIs são anunciados quando mudam (aria-live funciona).
- Erros de formulário são anunciados e foco é movido programaticamente para o primeiro erro.
- Inputs têm `aria-describedby` apontando para a mensagem de erro e leitor de tela lê a descrição.

4) Testes específicos do `PuppyForm` (create/edit)
- Acesse `/admin/filhotes/novo`.
- Tab até `Nome`, deixe vazio e tente `Salvar`:
  - Esperado: mensagem de status visível e anunciada (`aria-live`), campo `name` recebe foco, e erro aparece com id `name-error`; leitor de tela anuncia "Obrigatório".
- Preencher `Nome` e `Preço` inválido (0) e `Salvar`:
  - Esperado: erro de `priceCents` anunciado e foco em `priceCents`.
- Simular resposta do servidor com `fieldErrors` (se possível usar rota de teste): ver se erros do servidor são exibidos e vinculados.
- Mídia: teste upload via `MediaManager`, remover uma foto e salvar — verificar que `deletedPhotoUrls` é enviada e anúncio de sucesso após salvar.

Critérios de aceitação do formulário:
- Foco primeiro-erro funciona consistentemente (campo recebe foco e rolagem centralizada).
- Mensagens de erro têm `id` e `aria-describedby` ligado ao input.
- Mensagens de sucesso e erro global são anunciadas via `aria-live`.

5) Preferências reduzidas de movimento
- Ativar `prefers-reduced-motion` no navegador (DevTools) e validar que animações críticas não causam movimento indesejado (ex.: ping ou animações de loading menos intrusivas).

6) Registro de problemas
- Para cada falha, registre:
  - Local (ex: `AdminNav > Filhotes submenu`)
  - Passo para reproduzir
  - Comportamento observado
  - Comportamento esperado
  - Captura de tela / gravação curta (opcional)

Modelo de relatório (exemplo):
- Local: `PuppyForm` ao submeter sem `priceCents`.
- Passo: Acessar `/admin/filhotes/novo`, preencher `Nome`, deixar `Preço` em 0, pressionar `Enter` em "Salvar".
- Observado: Toast de erro aparece, mas leitor de tela não anunciou mensagem e foco permaneceu no botão.
- Esperado: foco deveria ir ao campo `Preço` e leitor de tela deveria anunciar "Preço deve ser > 0".

7) Automação / smoke checks (opcional)
- Recomendo criar testes E2E simples com Playwright para cobrir:
  - Navegação por teclado no `AdminNav` e abertura dos submenus.
  - Submissões do `PuppyForm` verificando foco e mensagens.
- Exemplo de comando (Playwright):
```bash
npx playwright test tests/admin-a11y.spec.ts
```

8) Aceitação final
- Todos os itens críticos de teclado e leitor de tela passados em checklist manual.
- Erros e regressões reportados no bugtracker com steps e evidências.

---

Se quiser, eu:
- gero `tests/admin-a11y.spec.ts` inicial em Playwright cobrindo fluxo-chave, ou
- executo uma sessão manual guiada e reporto falhas encontradas localmente (preciso que você rode o browser com leitor de tela e me diga observações), ou
- gero `docs/ADMIN_A11Y_CHECKLIST.md` (feito) e atualizo o TODO (feito).

Próximo passo sugerido: quer que eu gere o teste Playwright inicial (`tests/admin-a11y.spec.ts`)?