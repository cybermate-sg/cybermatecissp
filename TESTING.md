# Testing Guide - CISSP Mastery

## Quick Start

### Run E2E Tests

```bash
# Install dependencies (first time only)
pnpm install
pnpm exec playwright install chromium

# Run all tests
pnpm test:e2e

# Run tests with UI (recommended)
pnpm test:e2e:ui

# Run only class CRUD tests
pnpm test:e2e:classes
```

## Available Test Commands

| Command | Description |
|---------|-------------|
| `pnpm test:e2e` | Run all E2E tests in headless mode |
| `pnpm test:e2e:ui` | Open Playwright UI for interactive testing |
| `pnpm test:e2e:headed` | Run tests with visible browser |
| `pnpm test:e2e:debug` | Debug tests step-by-step |
| `pnpm test:e2e:report` | View HTML test report |
| `pnpm test:e2e:classes` | Run only admin class CRUD tests |

## Unit Tests (API)

API unit tests use Vitest and Bun to exercise Next.js route handlers directly.

### Quick start

```bash
bun install
bun test        # run all unit tests once
bun test:watch  # run in watch mode
```

Tests are co-located with the route files as `route.test.ts`, for example:
- `src/app/api/user/is-admin/route.test.ts`
- `src/app/api/bookmarks/route.test.ts`
- `src/app/api/bookmarks/[flashcardId]/route.test.ts`
- `src/app/api/sessions/create/route.test.ts`
- `src/app/api/sessions/end/route.test.ts`
- `src/app/api/sessions/card/route.test.ts`
- `src/app/api/progress/card/route.test.ts`
- `src/app/api/progress/domain/[domainId]/route.test.ts`
- `src/app/api/progress/update/route.test.ts`
- `src/app/api/subscription/status/route.test.ts`

Tests mock Clerk auth, database access, and Redis/cache so they run fast and do not touch real infrastructure.

## Test Suites

### 1. Admin Classes CRUD Tests

**File:** `e2e/admin-classes-crud.spec.ts`

Comprehensive testing of Class management operations:

- **CREATE**: 5 test cases
  - Create with all fields
  - Create draft class
  - Validation tests
  - Minimal required fields
  - Cancel operation

- **READ**: 3 test cases
  - View all classes
  - View individual class details
  - Empty state

- **UPDATE**: 5 test cases
  - Update name/description
  - Change color/icon
  - Toggle publish status
  - Update display order
  - Cancel update

- **DELETE**: 3 test cases
  - Successful deletion
  - Cancel deletion
  - Warning verification

- **EDGE CASES**: 6 test cases
  - Special characters
  - Long descriptions
  - Duplicate names
  - Data persistence
  - Zero order value
  - Rapid operations

**Total:** 22 test cases

## Manual Testing Checklist

Use this checklist when manually testing Class CRUD operations:

### Create Class
- [ ] Click "New Class" button
- [ ] Fill in class name
- [ ] Add description
- [ ] Select icon
- [ ] Select color theme
- [ ] Set display order
- [ ] Toggle published status
- [ ] Submit form
- [ ] Verify success toast appears
- [ ] Verify class appears in list
- [ ] Verify stats updated

### Read/View Classes
- [ ] View total classes count
- [ ] View published classes count
- [ ] Check class list displays correctly
- [ ] Verify class details (icon, name, description)
- [ ] Check draft badge shows for unpublished
- [ ] Click "Manage Decks" button
- [ ] Verify navigation to class detail page

### Update Class
- [ ] Click edit button on a class
- [ ] Update class name
- [ ] Update description
- [ ] Change icon
- [ ] Change color
- [ ] Update order
- [ ] Toggle published status
- [ ] Submit changes
- [ ] Verify success toast
- [ ] Verify changes reflected in list

### Delete Class
- [ ] Click delete button on a class
- [ ] Read warning message
- [ ] Verify deck count shown in warning
- [ ] Confirm deletion
- [ ] Verify success toast
- [ ] Verify class removed from list
- [ ] Verify stats updated

### Validation Tests
- [ ] Try creating class without name
- [ ] Test special characters in name
- [ ] Test very long description
- [ ] Test duplicate class names
- [ ] Cancel create operation
- [ ] Cancel update operation
- [ ] Cancel delete operation

## Test Environment Setup

### Prerequisites

1. **Admin Access Required**
   ```bash
   pnpm check-admin
   pnpm make-admin
   ```

2. **Development Server Running**
   ```bash
   pnpm dev
   ```
   Should be accessible at `http://localhost:3000`

3. **Database Accessible**
   - Ensure your database is running
   - Consider using a test database for E2E tests

### Optional: Test Database

For isolated testing, use a separate test database:

```bash
# Create test database
createdb cisspmastery_test

# Set up schema
DATABASE_URL="postgresql://user:password@localhost:5432/cisspmastery_test" pnpm db:push

# Run tests with test database
DATABASE_URL="postgresql://user:password@localhost:5432/cisspmastery_test" pnpm test:e2e
```

## Test Results

After running tests, results are available in multiple formats:

### HTML Report
```bash
pnpm test:e2e:report
```

Opens an interactive HTML report showing:
- Test results (passed/failed)
- Screenshots of failures
- Videos of test execution
- Detailed traces

### Console Output
Tests output results directly to console during execution.

### Artifacts Location
- **Screenshots**: `test-results/`
- **Videos**: `test-results/`
- **Traces**: `test-results/`
- **HTML Report**: `playwright-report/`

## CI/CD Integration

Tests can be integrated into your CI/CD pipeline. Example for GitHub Actions:

```yaml
- name: Run E2E Tests
  run: pnpm test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
```

## Debugging Failed Tests

### 1. Use UI Mode
Best for development and debugging:
```bash
pnpm test:e2e:ui
```

### 2. Use Debug Mode
Step through test execution:
```bash
pnpm test:e2e:debug
```

### 3. Run in Headed Mode
See the browser during test:
```bash
pnpm test:e2e:headed
```

### 4. View Test Report
Check screenshots and traces:
```bash
pnpm test:e2e:report
```

### 5. Check Logs
Look for console errors in test output and browser console.

## Common Issues

### Issue: Tests timeout
**Solution:** Increase timeout in `playwright.config.ts` or specific test

### Issue: Selectors not found
**Solution:** Check element exists, use proper waits, update selectors

### Issue: Authentication failures
**Solution:** Verify admin user exists and credentials are correct

### Issue: Database state conflicts
**Solution:** Use test database or reset database between test runs

## Best Practices

1. **Run tests before pushing code**
2. **Keep tests independent** - don't rely on test execution order
3. **Use descriptive test names** - clearly state what is being tested
4. **Clean up test data** - each test should create and clean up its own data
5. **Update tests when UI changes** - keep tests in sync with application
6. **Review test failures** - don't ignore failing tests

## Next Steps

- Review detailed documentation in `e2e/README.md`
- Add more test suites for other admin features
- Set up CI/CD integration
- Add API-level tests for better performance

## Support

For questions or issues with tests:
1. Check `e2e/README.md` for detailed documentation
2. Review Playwright documentation: https://playwright.dev
3. Open an issue in the project repository
