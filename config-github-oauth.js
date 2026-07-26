const puppeteer = require('puppeteer');

async function configureGitHubOAuth() {
  console.log('Starting GitHub OAuth configuration...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Step 1: Navigate to Supabase Dashboard login
    console.log('Navigating to Supabase Dashboard...');
    await page.goto('https://supabase.com/dashboard/sign-in', { waitUntil: 'networkidle2' });
    
    // Step 2: Click Continue with GitHub
    console.log('Clicking Continue with GitHub...');
    const githubBtn = await page.waitForSelector('button:has(svg path[d*="M12 0c-6.626"])');
    await githubBtn.click();
    
    // Step 3: Wait for GitHub authorization page
    console.log('Waiting for GitHub authorization...');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Step 4: If on GitHub auth page, click Authorize
    const authorizeBtn = await page.$('button:has-text("Authorize")');
    if (authorizeBtn) {
      console.log('Clicking Authorize...');
      await authorizeBtn.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Step 5: Navigate to Providers page
    console.log('Navigating to Providers page...');
    await page.goto('https://supabase.com/dashboard/project/ymdgkivkaagfrdnvvqbr/auth/providers', { waitUntil: 'networkidle2' });
    
    // Step 6: Click GitHub button
    console.log('Looking for GitHub button...');
    const githubProviderBtn = await page.waitForSelector('button:has-text("GitHub Disabled")');
    await githubProviderBtn.click();
    
    // Step 7: Wait for configuration panel
    console.log('Waiting for configuration panel...');
    await page.waitForTimeout(2000);
    
    // Step 8: Enable GitHub and enter credentials
    console.log('Configuring GitHub OAuth...');
    
    // Find and toggle the enable switch
    const switches = await page.$$('button[role="switch"]');
    for (const toggle of switches) {
      const isChecked = await toggle.evaluate(el => el.getAttribute('data-state') === 'checked' || el.getAttribute('aria-checked') === 'true');
      if (!isChecked) {
        await toggle.click();
        await page.waitForTimeout(500);
        break;
      }
    }
    
    // Enter Client ID
    const clientIdInput = await page.$('input[placeholder*="Client ID"], input[placeholder*="client id"]');
    if (clientIdInput) {
      await clientIdInput.click();
      await clientIdInput.evaluate(el => el.value = '');
      await clientIdInput.type('Ov23liL3uj0dzMZhrAMl');
      console.log('Client ID entered');
    }
    
    // Enter Client Secret
    const clientSecretInput = await page.$('input[type="password"], input[placeholder*="Client Secret"], input[placeholder*="client secret"]');
    if (clientSecretInput) {
      await clientSecretInput.click();
      await clientSecretInput.evaluate(el => el.value = '');
      await clientSecretInput.type('3ce02b782b514d41e216b103fae89cc8d4c1183b');
      console.log('Client Secret entered');
    }
    
    // Click Save button
    console.log('Clicking Save...');
    const saveBtn = await page.$('button:has-text("Save"), button:has-text("Save changes")');
    if (saveBtn) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      console.log('GitHub OAuth configured successfully!');
    }
    
    console.log('Configuration completed! Check the browser to verify.');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

configureGitHubOAuth();
