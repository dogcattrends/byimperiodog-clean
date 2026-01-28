const { chromium } = require('playwright');

async function inspect(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const items = await page.$$eval('*', (elements) => {
    const out = [];

    for (const el of elements) {
      const text = (el.textContent || '').trim();
      if (!text) continue;

      if (text === 'Filhotes' || text.startsWith('Filhotes')) {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const cs = getComputedStyle(el);
        out.push({
          tag: el.tagName.toLowerCase(),
          text: text.slice(0, 60),
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
          position: cs.position,
          display: cs.display,
          top: cs.top,
          left: cs.left,
          zIndex: cs.zIndex,
          className: (el.getAttribute('class') || '').slice(0, 120),
        });
      }
    }

    return out.slice(0, 40);
  });

  await browser.close();
  return items;
}

async function main() {
  for (const url of ['http://localhost:3001/', 'http://localhost:3001/filhotes']) {
    const items = await inspect(url);
    console.log(`\nURL: ${url}`);
    console.table(items);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
