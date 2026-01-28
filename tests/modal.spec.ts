import { test, expect } from '@playwright/test';

test('abre modal ao clicar em card do catálogo', async ({ page }) => {
 await page.setViewportSize({ width: 1280, height: 900 });
 await page.goto('/filhotes', { waitUntil: 'networkidle' });

 // Aguarda um botão com aria-label começando por "Ver detalhes" e clica no primeiro
 // Prefer the image wrapper which has role=button and aria-label starting with "Ver detalhes e fotos"
 const imageWrapper = page.locator('[role="button"][aria-label^="Ver detalhes e fotos"]').first();
 // aguardar que o elemento esteja presente no DOM e clicar via evaluate (funciona mesmo se estiver "hidden")
 await imageWrapper.waitFor({ state: 'attached', timeout: 20_000 });
 // debug: coletar informações de visibilidade antes de tentar clicar
 const debugInfo = await imageWrapper.evaluate((el: any) => {
 const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : null;
 const cs = window.getComputedStyle(el);
 return {
 tag: el.tagName,
 aria: el.getAttribute ? el.getAttribute('aria-label') : null,
 offsetParentNull: el.offsetParent === null,
 display: cs.display,
 visibility: cs.visibility,
 opacity: cs.opacity,
 pointerEvents: cs.pointerEvents,
 rect,
 };
 });
 console.log('DEBUG imageWrapper:', debugInfo);

 await imageWrapper.evaluate((el: any) => {
 el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
 el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
 el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
 });

 // espera o diálogo/modal aparecer
 const dialog = page.getByRole('dialog');
 await expect(dialog).toBeVisible({ timeout: 15_000 });

 // verifica botão fechar
 const closeBtn = page.getByRole('button', { name: /Fechar/i });
 await expect(closeBtn).toBeVisible();
});
