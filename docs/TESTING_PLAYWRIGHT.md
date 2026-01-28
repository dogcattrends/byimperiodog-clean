Executando testes Playwright (admin-a11y)

1) Preparar variáveis de ambiente

2) Iniciar o servidor de desenvolvimento (ou deixe o reuso do servidor habilitado no config)
```bash
npm run dev
```

3) Executar o teste específico (recomendado durante desenvolvimento local)
```markdown
Executando testes Playwright (admin-a11y)

Resumo rápido
- Testes de admin estão em `tests/admin-a11y.spec.ts` e o `testDir` do Playwright aponta para `./tests`.

Reprodutor (Windows PowerShell) — o fluxo que usei com sucesso
1) Limpe o build dev do Next para evitar artefatos:
```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
```

2) Carregue as variáveis de `.env.local` na sessão atual (ou defina `ADMIN_EMAIL`/`ADMIN_PASSWORD` manualmente):
```powershell
# carrega pares NAME=VALUE ignorando linhas comentadas
Get-Content .env.local | ForEach-Object {
	if ($_ -and $_ -notmatch '^\s*#') {
		$parts = $_ -split '='
		if ($parts.Length -ge 2) { Set-Item -Path Env:$($parts[0].Trim()) -Value (($parts[1..($parts.Length-1)] -join '=').Trim()) }
	}
}
```

3) Executar o teste Chromium específico:
```powershell
npx playwright test tests/admin-a11y.spec.ts -c playwright.config.ts --project=chromium
```

Notas e alternativas
- Você também pode exportar as variáveis manualmente no PowerShell antes de rodar (ex.: `$env:ADMIN_EMAIL = 'you@example.com'`).
- Se preferir POSIX shells (macOS/Linux), use `export ADMIN_EMAIL=...` e `rm -rf .next`.
- Se os testes não forem encontrados, confirme `testDir` em `playwright.config.ts`.

Problemas comuns
- "Please set ADMIN_EMAIL and ADMIN_PASSWORD": defina as variáveis de ambiente ou atualize `.env.playwright` e carregue no shell.
- Erros relacionados a `.next` cache: limpar `.next` como mostrado resolve build-cache inconsistências.

Próximo passo opcional
- Posso commitar estas instruções ao `docs/TESTING_PLAYWRIGHT.md` (feito) e abrir um PR com um pequeno script `scripts/test-admin.ps1` para automatizar o fluxo se desejar.

``` 

4) Problemas comuns

5) Próximos passos possíveis
