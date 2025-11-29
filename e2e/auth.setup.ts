import { test as setup } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

/**
 * Manual Authentication Setup
 *
 * This setup allows manual sign-in via LinkedIn OAuth when running in headed mode.
 * The authentication session will be saved and reused for future test runs.
 */
setup('authenticate', async ({ page, browser }) => {
  // Extend timeout to 3 minutes for manual authentication
  setup.setTimeout(180000);

  // Check if auth file already exists and is valid
  const authFilePath = path.resolve(authFile);
  if (fs.existsSync(authFilePath)) {
    console.log('');
    console.log('✅ Found existing authentication file');
    console.log('📝 Verifying authentication is still valid...');

    try {
      // Try to use the existing auth and verify it works
      const context = await browser.newContext({ storageState: authFile });
      const testPage = await context.newPage();

      // Try to navigate to admin page
      await testPage.goto('/admin/classes', {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });

      // Check if we're actually on the admin page (not redirected to login)
      const url = testPage.url();
      if (url.includes('/admin/classes')) {
        // Check for admin-specific element
        const hasNewClassButton = await testPage.locator('button:has-text("New Class")').isVisible({ timeout: 5000 });

        if (hasNewClassButton) {
          console.log('✅ Existing authentication is valid');
          console.log('🎉 Skipping re-authentication');
          console.log('');
          await testPage.close();
          await context.close();
          return; // Skip re-authentication
        }
      }

      await testPage.close();
      await context.close();
      console.log('⚠️  Existing authentication is invalid, re-authenticating...');
    } catch (error) {
      console.log('⚠️  Could not verify existing authentication, re-authenticating...');
    }
  }

  console.log('');
  console.log('🔐 Setting up authentication...');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  MANUAL SIGN-IN REQUIRED');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Please complete these steps in the browser:');
  console.log('1. Sign in with LinkedIn');
  console.log('2. Wait for redirect to admin/classes page');
  console.log('3. Test will continue automatically');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  try {
    // Navigate to home page first to avoid the redirect issue
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Then navigate to admin page (will redirect to LinkedIn OAuth if not authenticated)
    console.log('⏳ Navigating to admin page...');
    await page.goto('/admin/classes', {
      waitUntil: 'commit',  // Wait for navigation to commit, not for full load
      timeout: 30000
    }).catch(() => {
      // Ignore errors during navigation as OAuth redirect may cause issues
      console.log('⏳ Waiting for you to complete sign in...');
    });

    // Wait for the admin page to load after OAuth
    console.log('⏳ Waiting for you to sign in...');
    await page.waitForURL(/\/admin\/classes/, {
      timeout: 120000,
    });

    console.log('');
    console.log('✅ Successfully authenticated!');
    console.log('📝 Saving authentication state...');

    // Wait for the "New Class" button to ensure page is fully loaded
    await page.waitForSelector('button:has-text("New Class")', { timeout: 15000 });

    // Save the authenticated state
    await page.context().storageState({ path: authFile });

    console.log('✅ Authentication state saved to:', authFile);
    console.log('🎉 Future tests will use this session automatically');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Authentication failed!');
    console.error('');
    console.error('Error:', error);
    console.error('');
    console.error('Please ensure you:');
    console.error('  1. Signed in with LinkedIn');
    console.error('  2. Were redirected to /admin/classes');
    console.error('  3. Can see the admin page');
    console.error('');
    console.error('Then try running: pnpm test:e2e:headed');
    console.error('');
    throw new Error('Authentication failed - could not complete sign in');
  }
});
