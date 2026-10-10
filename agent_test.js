const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  let browser, page;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: true
    });
    page = await browser.newPage();
    console.log("Navigating to http://localhost:3000...");
    await page.goto('http://localhost:3000');
    
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });
    console.log("Login page loaded. Entering name 'AgentTester'...");
    
    await page.type('input[name="username"]', 'AgentTester');
    await page.click('button[type="submit"]');
    console.log("Clicked submit, waiting for Dashboard...");
    
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Add Test Goal'));
    }, { timeout: 5000 });
    console.log("Dashboard loaded successfully!");
    
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Add Test Goal'));
      if (addBtn) addBtn.click();
    });
    console.log("Clicked 'Add Test Goal'...");
    
    await new Promise(r => setTimeout(r, 2000));
    
    const goals = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h4')).map(e => e.textContent);
    });
    
    if (goals.some(g => g.includes('Focused Task'))) {
      console.log("✅ TEST SUCCESSFUL!");
    } else {
      console.log("❌ TEST FAILED: Goal did not appear.");
    }
    
    await browser.close();
  } catch (err) {
    console.error("Test execution error:", err);
    if (page) {
      await page.screenshot({ path: 'test_error.png' });
      console.log("Saved screenshot to test_error.png");
    }
    if (browser) await browser.close();
    process.exit(1);
  }
})();
