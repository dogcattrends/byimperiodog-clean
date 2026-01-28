#!/usr/bin/env node
import { chromium } from 'playwright';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

(async () => {
 const browser = await chromium.launch({ headless: true });
 const context = await browser.newContext();
 const page = await context.newPage();
 try {
 console.log('Navegando para', base);
 await page.goto(base, { waitUntil: 'networkidle' });

 const details = page.locator('button', { hasText: 'Ver detalhes' }).first();
 console.log('Aguardando botão de detalhes...');
 await details.waitFor({ state: 'visible', timeout: 15000 });

 console.log('Clicando no botão de detalhes...');
 await details.click();

 console.log('Aguardando diálogo (role=dialog)...');
 await page.waitForSelector('[role="dialog"]', { timeout: 15000 });

 console.log('Modal aberto com sucesso');
 await browser.close();
 process.exit(0);
 } catch (err) {
 console.error('Falha no teste:', err);
 try {
 await browser.close();
 } catch {}
 process.exit(2);
 }
})();
