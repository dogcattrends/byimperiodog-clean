import { test, expect } from '../playwright-fixtures';

test.describe('Puppy details modal accessibility', () => {
  test('opens modal, has dialog role, traps focus and closes', async ({ page }) => {
    await page.goto('/filhotes');

    // esperar por pelo menos um botão de abrir detalhes
    const openBtn = page.getByRole('button', { name: /Abrir detalhes do filhote/i }).first();
    await expect(openBtn).toBeVisible({ timeout: 15000 });

    await openBtn.click();

    // aguardar dialog
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });

    // verificar atributo aria-modal
    const ariaModal = await dialog.getAttribute('aria-modal');
    expect(ariaModal).toBe('true');

    // garantir que exista um botão de fechar com label acessível
    const close = page.getByRole('button', { name: /fechar modal/i }).first();
    await expect(close).toBeVisible();

    // foco inicial: verificar que o foco está dentro do diálogo
    const isFocusInside = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (!dlg) return false;
      return dlg.contains(document.activeElement);
    });
    expect(isFocusInside).toBeTruthy();

    // testar trap: tabular 20 vezes e garantir que foco permanece dentro do diálogo
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
    }
    const isFocusStillInside = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (!dlg) return false;
      return dlg.contains(document.activeElement);
    });
    expect(isFocusStillInside).toBeTruthy();

    // garantir que pelo menos uma imagem no modal tenha alt
    const imgWithAlt = await page.evaluate(() => {
      const dlg = document.querySelector('[role="dialog"]');
      if (!dlg) return false;
      const imgs = Array.from(dlg.querySelectorAll('img')) as HTMLImageElement[];
      return imgs.some(i => !!i.alt && i.alt.trim().length > 0);
    });
    expect(imgWithAlt).toBeTruthy();

    // fechar com botão
    await close.click();
    await expect(dialog).toBeHidden();
  });
});
