const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1024 });

  // 1. Admin Login
  await page.goto('http://localhost:3000/admin/login');
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2000));

  // 2. Admin Settings Configuration
  await page.goto('http://localhost:3000/admin/settings');
  // Wait for settings to load
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/home/kai/.gemini/antigravity/brain/612ae888-8ddf-4748-8b08-ab2152c3cc75/artifacts/admin_settings.png', fullPage: true });

  // 3. Customer Checkout Flow
  await page.goto('http://localhost:3000/');
  // Inject cart into localStorage
  await page.evaluate(() => {
    localStorage.setItem('cart-storage', JSON.stringify({
      state: {
        items: [{
          product: { id: 1, name: "Test Product", price: 100, image_url: "", unit: "kg" },
          quantity: 5
        }]
      },
      version: 0
    }));
  });
  await page.reload();
  await new Promise(r => setTimeout(r, 2000));

  // Go to checkout
  await page.goto('http://localhost:3000/checkout');
  await new Promise(r => setTimeout(r, 3000));
  
  // Take a screenshot of checkout before location is selected
  await page.screenshot({ path: '/home/kai/.gemini/antigravity/brain/612ae888-8ddf-4748-8b08-ab2152c3cc75/artifacts/checkout_initial.png', fullPage: true });

  // Try to click on the map to set location
  const mapElement = await page.$('.leaflet-container');
  if (mapElement) {
    const boundingBox = await mapElement.boundingBox();
    // Click in the middle of the map
    await page.mouse.click(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
    // Wait for delivery validation to finish
    await new Promise(r => setTimeout(r, 3000));
  }

  // Take a screenshot of checkout after location is selected (shows delivery validation)
  await page.screenshot({ path: '/home/kai/.gemini/antigravity/brain/612ae888-8ddf-4748-8b08-ab2152c3cc75/artifacts/checkout_validated.png', fullPage: true });

  await browser.close();
  console.log("Screenshots saved successfully.");
})();
