# E2E Testing Documentation

## Overview

This directory contains end-to-end (E2E) tests for the CISSP Mastery application using Playwright. The tests cover comprehensive CRUD (Create, Read, Update, Delete) operations for admin functionality.

## Test Structure

```
e2e/
├── admin-classes-crud.spec.ts    # Class CRUD operation tests
├── utils/
│   └── test-helpers.ts           # Helper functions and utilities
└── README.md                     # This file
```

## Prerequisites

1. **Node.js** and **pnpm** installed
2. **Playwright** installed (automatically done via `pnpm install`)
3. **Admin access** configured in your local environment
4. **Development server** running on `http://localhost:3000`

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install Playwright Browsers

```bash
pnpm exec playwright install chromium
```

### 3. Configure Test Environment

Copy the example environment file and configure it:

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and add your test credentials:

- Clerk test keys
- Test database URL
- Test admin user credentials

### 4. Prepare Test Database

It's recommended to use a separate test database to avoid affecting your development data:

```bash
# Create test database
createdb cisspmastery_test

# Run migrations
DATABASE_URL=postgresql://user:password@localhost:5432/cisspmastery_test pnpm db:push
```

### 5. Ensure Admin Access

Make sure you have an admin user in your test environment:

```bash
pnpm make-admin
```

## Running Tests

### Run All E2E Tests

```bash
pnpm test:e2e
```

### Run Tests with UI Mode (Recommended for Development)

```bash
pnpm test:e2e:ui
```

This opens the Playwright UI where you can:
- See all tests
- Run tests individually
- Watch tests in real-time
- Inspect each step
- View screenshots and videos

### Run Tests in Headed Mode (See Browser)

```bash
pnpm test:e2e:headed
```

### Debug Tests

```bash
pnpm test:e2e:debug
```

### Run Only Class CRUD Tests

```bash
pnpm test:e2e:classes
```

### View Test Report

After running tests, view the HTML report:

```bash
pnpm test:e2e:report
```

## Test Coverage

### Admin Classes CRUD Tests (`admin-classes-crud.spec.ts`)

#### CREATE Operations (5 tests)
- ✅ TC-1.1: Create a new class with all fields
- ✅ TC-1.2: Create an unpublished draft class
- ✅ TC-1.3: Validation - Create class without required name
- ✅ TC-1.4: Create class with minimal required fields
- ✅ TC-1.5: Cancel class creation

#### READ Operations (3 tests)
- ✅ TC-2.1: View all classes list
- ✅ TC-2.2: View individual class details via Manage Decks
- ✅ TC-2.3: Verify empty state when no classes exist

#### UPDATE Operations (5 tests)
- ✅ TC-3.1: Update class name and description
- ✅ TC-3.2: Change class color and icon
- ✅ TC-3.3: Toggle publish status from draft to published
- ✅ TC-3.4: Update display order
- ✅ TC-3.5: Cancel update operation

#### DELETE Operations (3 tests)
- ✅ TC-4.1: Delete a class successfully
- ✅ TC-4.2: Cancel delete operation
- ✅ TC-4.3: Verify delete warning message appears

#### Edge Cases and Validation (6 tests)
- ✅ TC-5.1: Create class with special characters in name
- ✅ TC-5.2: Create class with very long description
- ✅ TC-5.3: Create class with duplicate name
- ✅ TC-5.4: Navigate away and back to verify persistence
- ✅ TC-5.5: Test with order value of 0
- ✅ TC-5.6: Test rapid consecutive operations

**Total: 22 comprehensive test cases**

## Test Helpers

The `ClassTestHelpers` class provides reusable methods for testing:

### Navigation
- `navigateToClassesPage()` - Navigate to admin classes page
- `waitForPageLoad()` - Wait for page to fully load

### Dialog Operations
- `clickNewClass()` - Open create class dialog
- `fillClassForm(data)` - Fill class form with data
- `submitForm(action)` - Submit create/update form
- `cancelForm()` - Cancel dialog

### Edit/Delete Operations
- `clickEditClass(className)` - Open edit dialog for a class
- `clickDeleteClass(className)` - Open delete confirmation
- `confirmDelete()` - Confirm deletion
- `cancelDelete()` - Cancel deletion

### Verification Methods
- `classExists(className)` - Check if class exists
- `getTotalClassesCount()` - Get total classes count
- `getPublishedClassesCount()` - Get published classes count
- `isDraft(className)` - Check if class is a draft
- `getClassDetails(className)` - Get class details
- `waitForToast(message)` - Wait for toast notification

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { ClassTestHelpers } from './utils/test-helpers';

test.describe('My Test Suite', () => {
  let helpers: ClassTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new ClassTestHelpers(page);
    await helpers.navigateToClassesPage();
    await helpers.waitForPageLoad();
  });

  test('My test case', async ({ page }) => {
    // Your test code here
  });
});
```

### Example Test

```typescript
test('Create and delete a class', async ({ page }) => {
  // Create
  await helpers.clickNewClass();
  await helpers.fillClassForm({
    name: 'Test Class',
    description: 'Test description',
  });
  await helpers.submitForm('Create');
  await helpers.waitForToast('Class created successfully');

  // Verify
  const exists = await helpers.classExists('Test Class');
  expect(exists).toBe(true);

  // Delete
  await helpers.clickDeleteClass('Test Class');
  await helpers.confirmDelete();
  await helpers.waitForToast('Class deleted successfully');
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Tests create their own data and verify cleanup
3. **Waits**: Use proper waits (`waitForSelector`, `waitForLoadState`) instead of arbitrary timeouts
4. **Assertions**: Always verify expected outcomes with assertions
5. **Selectors**: Use semantic selectors (text, roles) over CSS selectors when possible
6. **Error Handling**: Tests should handle both success and failure cases

## Debugging Tips

### 1. Use UI Mode
The Playwright UI mode is the best way to debug tests:
```bash
pnpm test:e2e:ui
```

### 2. Use Debug Mode
Step through tests one action at a time:
```bash
pnpm test:e2e:debug
```

### 3. Add Screenshots
Add manual screenshots in tests:
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### 4. Use Console Logs
Add debug output:
```typescript
console.log('Current URL:', page.url());
console.log('Class count:', await helpers.getTotalClassesCount());
```

### 5. Inspect Locators
Test selectors in debug mode:
```typescript
const element = page.locator('your-selector');
console.log('Element count:', await element.count());
console.log('Element visible:', await element.isVisible());
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.TEST_CLERK_PK }}
          CLERK_SECRET_KEY: ${{ secrets.TEST_CLERK_SK }}

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Failing Due to Timeouts

Increase timeout in test or globally:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Authentication Issues

Ensure your test admin user exists and has proper permissions:
```bash
pnpm check-admin
pnpm make-admin
```

### Database State Issues

Reset test database between runs:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/cisspmastery_test pnpm db:push
```

### Selector Not Found

1. Check if element exists in the page
2. Wait for the element to be visible
3. Use more specific or semantic selectors
4. Check for dynamic content loading

## Support

For issues or questions:
1. Check the [Playwright documentation](https://playwright.dev)
2. Review existing test examples in this directory
3. Open an issue in the project repository

## Future Enhancements

- [ ] Add API-level tests for faster execution
- [ ] Add visual regression testing
- [ ] Add accessibility testing with axe-core
- [ ] Add performance testing
- [ ] Add mobile viewport testing
- [ ] Add cross-browser testing (Firefox, Safari)
- [ ] Add parallel test execution with data isolation
- [ ] Add test data factories for complex scenarios
