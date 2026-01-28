import { test, expect } from './playwright-fixtures';

// Testes a11y básicos para o painel Admin
// Requisitos: rodar contra servidor dev (`npm run dev`) com rota /admin disponível.

test.describe('Admin accessibility smoke', () => {
 test.beforeEach(async ({ page, login }) => {
 // Autentica antes de cada teste usando a fixture de login
 await login(page);
 });

 test('Keyboard navigation: open Filhotes submenu and activate actions', async ({ page }) => {
 // Garantir viewport desktop para a barra lateral estar visível (evita variantes mobile)
 await page.setViewportSize({ width: 1280, height: 800 });
 await page.goto('/admin');

 // Procurar o summary que contenha 'Filhotes' (mais robusto que depender de aria-label)
 const summary = page.locator('summary:has-text("Filhotes")').first();
 await expect(summary).toBeVisible({ timeout: 10000 });

 // Abrir submenu com Enter
 await summary.press('Enter');

 // Verificar que itens do menu aparecem e que o link 'Novo filhote' está visível
 const novo = page.getByRole('link', { name: /novo filhote/i }).first();
 await expect(novo).toBeVisible({ timeout: 5000 });

 // Clicar no primeiro link 'Novo filhote' (sidebar)
 await novo.click();

 // Deve navegar para a página de novo filhote
 await expect(page).toHaveURL(/\/admin\/filhotes\/novo/);
 });

 test('Puppy form: submitting empty shows error and focuses first field', async ({ page }) => {
 await page.goto('/admin/filhotes/novo');

 // Garantir que o form está presente
 const save = page.getByRole('button', { name: /salvar/i });
 await expect(save).toBeVisible();

 // Submeter sem preencher
 await save.click();

 // O teste assume que o formulário move o foco para o primeiro campo com erro (name)
 const nameInput = page.locator('#name');
 await expect(nameInput).toBeFocused();

 // Verificar se o erro de campo está visível e ligado via aria-describedby
 const nameError = page.locator('#name-error');
 await expect(nameError).toBeVisible();
 const described = await nameInput.getAttribute('aria-describedby');
 expect(described).toContain('name-error');
 });

 test('Dashboard KPIs announce changes (aria-live)', async ({ page }) => {
 await page.goto('/admin');
 const available = page.getByText(/Disponíveis/i).locator('xpath=..').getByRole('heading', { level: 0 }).first();
 // apenas garantir que o elemento com aria-live existe
 const kpi = page.locator('strong[aria-live]');
 await expect(kpi.first()).toBeVisible();
 });
});
