/**
 * Capture Authentication Session for E2E Tests
 *
 * This script helps capture your authenticated session from your browser
 * so that E2E tests can run with the same authentication.
 *
 * Prerequisites:
 * 1. Make sure you're signed in to http://localhost:3000 in Chrome
 * 2. Verify you have admin access
 * 3. Run this script: bun run scripts/capture-auth-session.ts
 */

import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function captureSession() {
  console.log('🔐 Capturing authenticated session...\n');

  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized'],
  });

  const context = await browser.newContext({
    viewport: null,
  });

  const page = await context.newPage();

  console.log('📝 Instructions:');
  console.log('1. A browser window will open');
  console.log('2. Sign in with LinkedIn');
  console.log('3. Navigate to the admin classes page');
  console.log('4. Press ENTER in this terminal when ready\n');

  await page.goto('http://localhost:3000/sign-in');

  // Wait for user input
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => {
      console.log('\n✅ Capturing session...');
      resolve();
    });
  });

  // Check if user is on admin page
  const currentUrl = page.url();
  if (!currentUrl.includes('/admin')) {
    console.warn('⚠️  Warning: You are not on an admin page.');
    console.warn('   Current URL:', currentUrl);
    console.warn('   Please navigate to /admin/classes and try again.');
    await browser.close();
    process.exit(1);
  }

  // Save the session
  const authDir = path.join(process.cwd(), 'playwright', '.auth');
  const authFile = path.join(authDir, 'user.json');

  // Create directory if it doesn't exist
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  await context.storageState({ path: authFile });

  console.log('✅ Session saved to:', authFile);
  console.log('🎉 You can now run E2E tests with: bun run test:e2e:classes\n');

  await browser.close();
}

captureSession().catch((error) => {
  console.error('❌ Error capturing session:', error);
  process.exit(1);
});
