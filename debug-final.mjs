import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message.slice(0, 150)));

// landing shows all categories
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
const cats = await page.$$eval('.category-card, [class*="category"] h3', els => els.map(e => e.textContent.trim())).catch(() => []);
console.log('landing categories:', cats.join(' | ') || '(check selector)');

for (const [name, url] of [
  ['aws', 'http://localhost:5173/chapter/module-01'],
  ['bedrock', 'http://localhost:5173/courses/bedrock/workbook/Chapter_01_introduction_to_bedrock_agentcore'],
  ['linux', 'http://localhost:5173/courses/linux/phase-01-linux-foundations/Chapter_01_History_of_Unix_and_Linux'],
  ['docker', 'http://localhost:5173/courses/docker/docker/module-01-introduction-to-containers-and-docker'],
  ['python', 'http://localhost:5173/courses/python-devops/python-devops/ch01-getting-started-with-python-devops'],
  ['k8s', 'http://localhost:5173/courses/kubernetes/kubernetes/Level-01-Containers-and-Docker-Foundations'],
  ['bop', 'http://localhost:5173/courses/basic-programming/basic-programming/01-variables'],
  ['codeadv', 'http://localhost:5173/courses/codeadventure/codeadventure/01-onboarding'],
]) {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  await page.waitForSelector('.slide-section', { timeout: 8000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 300));
  const w = await page.evaluate(() => ({
    secs: document.querySelectorAll('.slide-section').length,
    lab: document.querySelectorAll('.lab-card').length,
    quiz: document.querySelectorAll('.quiz-card').length,
    term: document.querySelectorAll('.terminal').length,
    acc: document.querySelectorAll('.accordion-item').length,
    alerts: document.querySelectorAll('.slide-html .alert, .alert').length,
    codeBlocks: document.querySelectorAll('.code-block').length,
    slideUi: !!document.body.innerText.match(/Slide \d+ of \d+/),
    navBtns: [...document.querySelectorAll('button')].filter(b => /previous|next/i.test(b.textContent) && !/chapter/i.test(b.textContent)).length,
  }));
  console.log(name, JSON.stringify(w));
}
console.log('errors:', errors.length ? errors.slice(0, 8) : 'none');
await browser.close();
