import { test as setup } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

/**
 * Manual Authentication Setup
 *
 * This setup allows manual sign-in via LinkedIn OAuth when running in headed mode.
 * The authentication session will be saved and reused for future test runs.
 */
setup('authenticate', async ({ page }) => {
  // Extend timeout to 3 minutes for manual authentication
  setup.setTimeout(180000);
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

  // Navigate to admin page (will redirect to LinkedIn OAuth if not authenticated)
  await page.goto('/admin/classes');

  try {
    // Wait for either admin page or sign-in page to load
    console.log('⏳ Waiting for you to sign in...');

    // Wait up to 2 minutes for the admin page to load (giving user time to sign in via LinkedIn)
    await page.waitForURL(/\/admin\/classes/, {
      timeout: 120000,
      waitUntil: 'networkidle'
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
    console.error('❌ Authentication timeout!');
    console.error('');
    console.error('Please ensure you:');
    console.error('  1. Signed in with LinkedIn');
    console.error('  2. Were redirected to /admin/classes');
    console.error('  3. Can see the admin page');
    console.error('');
    console.error('Then try running: pnpm test:e2e:headed');
    console.error('');
    throw new Error('Authentication timeout - did not reach admin page within 2 minutes');
  }
});
