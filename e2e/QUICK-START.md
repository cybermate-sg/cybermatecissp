# Quick Start - Running E2E Tests

## ⚡ Easiest Way to Run Tests

Since the app uses LinkedIn OAuth, you need to authenticate once before tests can run.

### Step 1: Run Tests in Headed Mode

```bash
pnpm test:e2e:headed
```

### Step 2: Sign In When Browser Opens

1. A Chrome browser will open automatically
2. **Sign in with LinkedIn** when you see the sign-in page
3. **Navigate to** `http://localhost:3000/admin/classes`
4. **Wait** for the page to load completely
5. The tests will automatically start running

### Step 3: Session is Saved

After the first run, your session is saved to `playwright/.auth/user.json`

### Step 4: Run Future Tests Normally

For future test runs, you can use the faster headless mode:

```bash
pnpm test:e2e:classes
```

The tests will use your saved session and run without opening a browser.

---

## 🔄 If Session Expires

If you see authentication errors again, simply run `pnpm test:e2e:headed` again and re-authenticate.

---

## 🎯 What Happens During Tests

The tests will:
- ✅ Create new classes
- ✅ Read/view classes
- ✅ Update class details
- ✅ Delete classes
- ✅ Test validation and edge cases

**Total: 22 test cases**

Expected duration: ~2-5 minutes

---

## 📊 View Test Results

After tests complete, view the HTML report:

```bash
pnpm test:e2e:report
```

This opens an interactive report showing:
- ✅ Passed tests
- ❌ Failed tests (if any)
- 📸 Screenshots
- 🎥 Videos of test execution
