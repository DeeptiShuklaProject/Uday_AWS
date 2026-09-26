import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('pageerror', e => errors.push(e.message.slice(0, 150)));
await page.goto('http://localhost:5173/courses/bedrock/workbook/Chapter_01_introduction_to_bedrock_agentcore', { waitUntil: 'networkidle0' });
await page.waitForSelector('.slide-section', { timeout: 10000 });
await new Promise(r => setTimeout(r, 800));
const info = await page.evaluate(() => ({
  archSections: document.querySelectorAll('.diagram-wrapper').length,
  nodes: document.querySelectorAll('.diagram-wrapper svg g').length,
}));
await page.evaluate(() => document.querySelector('.diagram-wrapper')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-arch.png' });
// click a node → detail panel
await page.evaluate(() => {
  const g = [...document.querySelectorAll('.diagram-wrapper svg g')].find(g => g.style.cursor === 'pointer');
  g?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: 'shot-arch-click.png' });
console.log('arch widgets:', JSON.stringify(info));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
