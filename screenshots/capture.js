const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5173';
const OUT_DIR = path.join(__dirname, 'pages');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 模拟手机尺寸（iPhone 14）
const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function shot(page, name, url, waitFor = 2000) {
  console.log(`截图: ${name} -> ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, waitFor));
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true });
  console.log(`  ✅ saved: ${name}.png`);
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // 先注入假token绕过登录守卫（如果有的话）
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('token', 'demo-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'demo', nickname: '张明华', email: 'demo@test.com'
    }));
  });

  try {
    // 1. 登录页
    await shot(page, '01_login', `${BASE_URL}/#/pages/login/login`);

    // 2. 首页（注册/回忆录主页）
    await shot(page, '02_index', `${BASE_URL}/#/pages/index/index`);

    // 3. 章节列表
    await shot(page, '03_memoir', `${BASE_URL}/#/pages/memoir/memoir`);

    // 4. 章节编辑（背景章节）
    await shot(page, '04_chapter_background', `${BASE_URL}/#/pages/chapters/chapters?chapterId=background`);

    // 5. AI聊天
    await shot(page, '05_ai_chat', `${BASE_URL}/#/pages/ai-chat/ai-chat`);

    // 6. 录音页
    await shot(page, '06_recording', `${BASE_URL}/#/pages/recording/recording`);

    // 7. 随记
    await shot(page, '07_diary', `${BASE_URL}/#/pages/diary/diary`);

    // 8. 个人中心
    await shot(page, '08_profile', `${BASE_URL}/#/pages/profile/profile`);

    // 9. PDF管理
    await shot(page, '09_pdf', `${BASE_URL}/#/pages/pdf-manager/pdf-manager`);

  } catch(e) {
    console.error('截图出错:', e.message);
  }

  await browser.close();
  console.log('\n所有截图已保存到:', OUT_DIR);
})();
