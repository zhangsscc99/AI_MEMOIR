const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOTS_DIR = 'C:\\Users\\宇庭\\Desktop\\AI_MEMOIR\\screenshots\\pages';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Helper: inject localStorage auth tokens
  async function injectAuth() {
    await page.evaluate(() => {
      localStorage.setItem('token', 'fake-token-for-screenshots');
      localStorage.setItem('user', JSON.stringify({ id: 'demo', nickname: '张明华' }));
    });
  }

  // ── 1. Root page ──────────────────────────────────────────────────────────
  console.log('1/5  Navigating to http://localhost:5173');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await sleep(3000);
  const title1 = await page.title();
  const url1 = page.url();
  console.log(`     title="${title1}"  url=${url1}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pw_01_home.png'), fullPage: true });
  console.log('     Saved pw_01_home.png');

  // ── 2. Index page ─────────────────────────────────────────────────────────
  console.log('2/5  Navigating to #/pages/index/index');
  await injectAuth();
  await page.goto('http://localhost:5173/#/pages/index/index', { waitUntil: 'networkidle' });
  await sleep(3000);
  const title2 = await page.title();
  const url2 = page.url();
  console.log(`     title="${title2}"  url=${url2}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pw_02_index.png'), fullPage: true });
  console.log('     Saved pw_02_index.png');

  // ── 3. AI Chat page ───────────────────────────────────────────────────────
  console.log('3/5  Navigating to #/pages/ai-chat/index');
  await injectAuth();
  await page.goto('http://localhost:5173/#/pages/ai-chat/index', { waitUntil: 'networkidle' });
  await sleep(3000);
  const title3 = await page.title();
  const url3 = page.url();
  console.log(`     title="${title3}"  url=${url3}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pw_03_chat.png'), fullPage: true });
  console.log('     Saved pw_03_chat.png');

  // ── 4. Diary page ─────────────────────────────────────────────────────────
  console.log('4/5  Navigating to #/pages/diary/index');
  await injectAuth();
  await page.goto('http://localhost:5173/#/pages/diary/index', { waitUntil: 'networkidle' });
  await sleep(3000);
  const title4 = await page.title();
  const url4 = page.url();
  console.log(`     title="${title4}"  url=${url4}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pw_04_diary.png'), fullPage: true });
  console.log('     Saved pw_04_diary.png');

  // ── 5. Profile page ───────────────────────────────────────────────────────
  console.log('5/5  Navigating to #/pages/profile/index');
  await injectAuth();
  await page.goto('http://localhost:5173/#/pages/profile/index', { waitUntil: 'networkidle' });
  await sleep(3000);
  const title5 = await page.title();
  const url5 = page.url();
  console.log(`     title="${title5}"  url=${url5}`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pw_05_profile.png'), fullPage: true });
  console.log('     Saved pw_05_profile.png');

  await browser.close();
  console.log('\nAll screenshots saved successfully.');
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
