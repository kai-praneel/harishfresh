const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  // Capture homepage
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/kai/.gemini/antigravity/brain/612ae888-8ddf-4748-8b08-ab2152c3cc75/artifacts/debug_homepage.png', fullPage: true });

  // Capture admin products
  await page.goto('http://localhost:3000/admin/products');
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/kai/.gemini/antigravity/brain/612ae888-8ddf-4748-8b08-ab2152c3cc75/artifacts/debug_admin_products.png', fullPage: true });

  await browser.close();
})();
