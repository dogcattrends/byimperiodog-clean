<#
scripts/test-admin.ps1
Automatiza execução dos testes Playwright de admin em PowerShell.
Uso:
  .\scripts\test-admin.ps1                 # usa .env.local e Chromium
  .\scripts\test-admin.ps1 .env.playwright # usa outro arquivo de env
  .\scripts\test-admin.ps1 .env.local firefox # escolhe projeto Playwright
#>
Param(
  [string]$EnvFile = ".env.local",
  [string]$Project = "chromium"
)

Write-Host "[test-admin] Usando arquivo de env: $EnvFile e projeto: $Project"

# Carrega variáveis KEY=VALUE do arquivo de ambiente (ignora comentários)
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    if ($_ -and $_ -notmatch '^\s*#') {
      $parts = $_ -split '=', 2
      if ($parts.Length -ge 2) {
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        Write-Host "[test-admin] Definindo env: $name"
        Set-Item -Path Env:$name -Value $value
      }
    }
  }
} else {
  Write-Host "[test-admin] Aviso: arquivo de env '$EnvFile' não encontrado. Verifique se ADMIN_EMAIL/ADMIN_PASSWORD estão definidos." -ForegroundColor Yellow
}

# Limpar cache/build do Next.js para evitar artefatos
Write-Host "[test-admin] Removendo .next (se existir)"
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Executar Playwright para spec de admin
$cmd = "npx playwright test tests/admin-a11y.spec.ts -c playwright.config.ts --project=$Project"
Write-Host "[test-admin] Executando: $cmd"
Invoke-Expression $cmd
