const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 420 } });
  await page.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const results = await page.$$eval('a', (anchors) => {
    const out = [];
    for (const a of anchors) {
      const t = (a.textContent || '').trim();
      if (t !== 'Filhotes') continue;

      const r = a.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;

      const chain = [];
      let el = a;
      let steps = 0;
      while (el && steps < 12) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = (el.getAttribute('class') || '').trim();
        chain.push(`${tag}${id}${cls ? '.' + cls.split(/\s+/).slice(0, 4).join('.') : ''}`);
        el = el.parentElement;
        steps += 1;
      }

      out.push({
        x: Math.round(r.x),
        y: Math.round(r.y),
        w: Math.round(r.width),
        h: Math.round(r.height),
        href: a.getAttribute('href'),
        className: (a.getAttribute('class') || '').slice(0, 140),
        chain,
      });
    }
    return out;
  });

  console.log(JSON.stringify(results, null, 2));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
