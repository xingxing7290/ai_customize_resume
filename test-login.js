const puppeteer = require('puppeteer');

async function testLogin() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();

    // 监听控制台输出
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('hydration') || text.includes('error') || text.includes('Error')) {
        console.log('!!! 重要控制台消息:', text);
      } else {
        console.log('浏览器控制台:', text);
      }
    });

    // 监听网络请求
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        console.log('API 请求发送:', request.url(), request.method());
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/auth/login')) {
        console.log('API 响应:', response.url(), response.status());
        // 尝试读取响应内容
        try {
          const text = await response.text();
          if (text) {
            console.log('响应内容:', text.substring(0, 500));
          }
        } catch (e) {
          console.log('无法读取响应:', e.message);
        }
      }
    });

    console.log('访问登录页面...');
    await page.goto('http://113.44.50.108:3000/login', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('等待页面加载...');
    await page.waitForSelector('form', { timeout: 10000 });

    // 检查页面内容
    const title = await page.$eval('h1', el => el.textContent);
    console.log('页面标题:', title);

    // 检查按钮
    const buttonInfo = await page.$eval('button', el => ({
      text: el.textContent,
      disabled: el.disabled,
      type: el.type,
    }));
    console.log('按钮信息:', buttonInfo);

    // 填写表单
    console.log('填写登录表单...');
    // 先清空再输入
    await page.$eval('input[name="email"]', el => el.value = '');
    await page.$eval('input[name="password"]', el => el.value = '');
    await page.type('input[name="email"]', 'test@test.com');
    await page.type('input[name="password"]', 'test123');

    // 点击登录按钮
    console.log('点击登录按钮...');

    // 直接点击按钮
    await page.click('button');
    console.log('按钮已点击');

    // 等待响应和可能的导航
    console.log('等待响应...');

    // 等待导航或超时
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        new Promise(r => setTimeout(r, 10000))
      ]);
    } catch (e) {
      console.log('导航等待:', e.message);
    }

    // 检查 localStorage
    let token = null;
    try {
      token = await page.evaluate(() => localStorage.getItem('accessToken'));
    } catch (e) {
      console.log('无法读取 localStorage:', e.message);
    }
    console.log('localStorage token:', token ? '存在 (长度: ' + token.length + ')' : '不存在');

    // 检查页面是否跳转
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);

    // 检查是否有消息显示
    const pageContent = await page.content();
    console.log('页面包含 "正在登录":', pageContent.includes('正在登录'));
    console.log('页面包含 "登录成功":', pageContent.includes('登录成功'));
    console.log('页面包含 "登录失败":', pageContent.includes('登录失败'));

    // 截图
    await page.screenshot({ path: '/tmp/login-test.png' });
    console.log('截图已保存到 /tmp/login-test.png');

    if (currentUrl.includes('/profiles')) {
      console.log('✅ 登录成功！已跳转到 profiles 页面');
    } else {
      console.log('❌ 登录失败，仍在登录页面');
    }

  } catch (error) {
    console.error('测试出错:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();