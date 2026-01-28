const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 420 } });

  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tmp/header-home.png', fullPage: false });

  await page.goto('http://localhost:3001/filhotes', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  await page.screenshot({ path: 'tmp/header-filhotes.png', fullPage: false });

  await browser.close();
  console.log('Saved tmp/header-home.png and tmp/header-filhotes.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
