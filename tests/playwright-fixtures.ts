import { test as base, type Page } from '@playwright/test';

type Fixtures = {
  login: (page?: Page) => Promise<void>;
};

export const test = base.extend<Fixtures>({
  login: async ({}, use) => {
    await use(async (page?: Page) => {
      const email = process.env.ADMIN_EMAIL;
      const password = process.env.ADMIN_PASSWORD;
      if (!email || !password) {
        throw new Error('Please set ADMIN_EMAIL and ADMIN_PASSWORD environment variables for Playwright login fixture');
      }
      if (!page) throw new Error('Page is required for login fixture');
      // navegar para a tela de login com timeout maior
      await page.goto('/admin/login', { waitUntil: 'load', timeout: 60_000 });
      // preencher form de login
      await page.getByPlaceholder('admin@exemplo.com').fill(email);
      await page.getByPlaceholder('********').fill(password);
      await page.getByRole('button', { name: /entrar/i }).click();
      // esperar pelo dashboard com timeout e fallback para seletor
      try {
        await page.waitForURL(/\/admin\/dashboard/, { timeout: 60_000 });
      } catch (err) {
        // fallback: aguardar elemento de dashboard visível
        await page.waitForSelector('text=Dashboard', { timeout: 60_000 });
      }
    });
  },
});

export { expect } from '@playwright/test';
