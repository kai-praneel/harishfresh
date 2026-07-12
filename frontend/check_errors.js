const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));
  
  await page.goto('http://localhost:3000/');
  await new Promise(r => setTimeout(r, 2000));
  
  await page.goto('http://localhost:3000/admin/products');
  await new Promise(r => setTimeout(r, 2000));

  await browser.close();
})();
