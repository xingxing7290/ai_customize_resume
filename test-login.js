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

    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log('API 响应:', response.url(), response.status());
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
    const buttonInfo = await page.$eval('button[type="submit"]', el => ({
      text: el.textContent,
      disabled: el.disabled,
      type: el.type,
    }));
    console.log('按钮信息:', buttonInfo);

    // 填写表单
    console.log('填写登录表单...');
    await page.type('input[name="email"]', 'test@test.com');
    await page.type('input[name="password"]', 'test123');

    // 点击登录按钮
    console.log('点击登录按钮...');

    // 检查 form 的 onSubmit 是否存在
    const formInfo = await page.$eval('form', form => {
      return {
        hasOnSubmit: form.onsubmit !== null,
        action: form.action,
        method: form.method,
      };
    });
    console.log('Form 信息:', formInfo);

    // 尝试触发 form submit 事件
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        // 创建并触发 submit 事件
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // 等待一下
    await new Promise(r => setTimeout(r, 1000));

    // 如果还是没有反应，直接在页面中执行 fetch
    console.log('尝试直接执行 fetch...');
    const result = await page.evaluate(() => {
      return fetch('http://113.44.50.108:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'test123' }),
      })
        .then(res => res.json())
        .then(data => JSON.stringify(data))
        .catch(err => 'Error: ' + err.message);
    });
    console.log('直接 fetch 结果:', result);

    // 等待响应
    console.log('等待响应...');
    await new Promise(r => setTimeout(r, 5000));

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