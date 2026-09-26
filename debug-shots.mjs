import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Docker: Commands Deep Dive → command widgets + terminal
await page.goto('http://localhost:5173/courses/docker/docker/module-01-introduction-to-containers-and-docker', { waitUntil: 'networkidle0' });
await page.waitForSelector('.terminal', { timeout: 8000 });
await page.evaluate(() => document.querySelector('.terminal')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: 'shot-docker-terminal.png' });

// Linux: Certification Practice quiz + Hands-on Lab
await page.goto('http://localhost:5173/courses/linux/phase-01-linux-foundations/Chapter_01_History_of_Unix_and_Linux', { waitUntil: 'networkidle0' });
await page.waitForSelector('.quiz-card', { timeout: 8000 });
await page.evaluate(() => document.querySelector('.quiz-card')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-linux-quiz.png' });
await page.evaluate(() => document.querySelector('.lab-card')?.scrollIntoView({ behavior: 'instant', block: 'start' }));
await new Promise(r => setTimeout(r, 500));
await page.screenshot({ path: 'shot-linux-lab.png' });

// Bedrock interview section
await page.goto('http://localhost:5173/courses/bedrock/workbook/Chapter_01_introduction_to_bedrock_agentcore', { waitUntil: 'networkidle0' });
await page.waitForSelector('.slide-section', { timeout: 8000 });
const hasInterview = await page.evaluate(() => {
  const sec = [...document.querySelectorAll('.slide-section')].find(s => /interview/i.test(s.textContent));
  if (sec) { sec.scrollIntoView({ behavior: 'instant', block: 'start' }); return true; }
  return false;
});
await new Promise(r => setTimeout(r, 500));
if (hasInterview) await page.screenshot({ path: 'shot-bedrock-interview.png' });
console.log('bedrock interview section:', hasInterview);
await browser.close();
