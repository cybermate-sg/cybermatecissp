import { test as setup, Browser, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = 'playwright/.auth/user.json';

async function verifyExistingAuth(browser: Browser): Promise<boolean> {
  console.log('');
  console.log('✅ Found existing authentication file');
  console.log('📝 Verifying authentication is still valid...');

  try {
    const context = await browser.newContext({ storageState: authFile });
    const testPage = await context.newPage();

    await testPage.goto('/admin/classes', {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    });

    const url = testPage.url();
    if (url.includes('/admin/classes')) {
      const hasNewClassButton = await testPage.locator('button:has-text("New Class")').isVisible({ timeout: 5000 });

      if (hasNewClassButton) {
        console.log('✅ Existing authentication is valid');
        console.log('🎉 Skipping re-authentication');
        console.log('');
        await testPage.close();
        await context.close();
        return true;
      }
    }

    await testPage.close();
    await context.close();
    console.log('⚠️  Existing authentication is invalid, re-authenticating...');
  } catch (error) {
    console.log('⚠️  Could not verify existing authentication, re-authenticating...');
  }

  return false;
}

function printSignInInstructions(): void {
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
}

async function performAuthentication(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

  console.log('⏳ Navigating to admin page...');
  await page.goto('/admin/classes', {
    waitUntil: 'commit',
    timeout: 30000
  }).catch(() => {
    console.log('⏳ Waiting for you to complete sign in...');
  });

  console.log('⏳ Waiting for you to sign in...');
  await page.waitForURL(/\/admin\/classes/, { timeout: 120000 });

  console.log('');
  console.log('✅ Successfully authenticated!');
  console.log('📝 Saving authentication state...');

  await page.waitForSelector('button:has-text("New Class")', { timeout: 15000 });
  await page.context().storageState({ path: authFile });

  console.log('✅ Authentication state saved to:', authFile);
  console.log('🎉 Future tests will use this session automatically');
  console.log('');
}

function handleAuthError(error: unknown): never {
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

/**
 * Manual Authentication Setup
 *
 * This setup allows manual sign-in via LinkedIn OAuth when running in headed mode.
 * The authentication session will be saved and reused for future test runs.
 */
setup('authenticate', async ({ page, browser }) => {
  setup.setTimeout(180000);

  const authFilePath = path.resolve(authFile);
  if (fs.existsSync(authFilePath)) {
    const isValid = await verifyExistingAuth(browser);
    if (isValid) return;
  }

  printSignInInstructions();

  try {
    await performAuthentication(page);
  } catch (error) {
    handleAuthError(error);
  }
});
