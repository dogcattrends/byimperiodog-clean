const { chromium } = require('playwright');

const TARGETS = [
  'By Império Dog',
  'Início',
  'Filhotes',
  'Processo',
  'FAQ',
  'Blog',
  'Contato',
  'Atendimento via WhatsApp',
  'Ver filhotes',
];

async function inspect(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 420 } });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const rows = [];
  for (const text of TARGETS) {
    const locator = page.locator(`text=${JSON.stringify(text)}`).first();
    if ((await locator.count()) === 0) continue;

    const box = await locator.boundingBox();
    if (!box) continue;

    const info = await locator.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        position: cs.position,
        display: cs.display,
        className: (el.getAttribute('class') || '').slice(0, 120),
      };
    });

    rows.push({
      text,
      x: Math.round(box.x),
      y: Math.round(box.y),
      w: Math.round(box.width),
      h: Math.round(box.height),
      ...info,
    });
  }

  await browser.close();
  return rows;
}

async function main() {
  for (const url of ['http://localhost:3001/', 'http://localhost:3001/filhotes']) {
    const rows = await inspect(url);
    console.log(`\nURL: ${url}`);
    console.table(rows);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
