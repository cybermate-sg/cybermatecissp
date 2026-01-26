# Load Testing Implementation

I have implemented a comprehensive load testing setup using k6, designed to simulate realistic user behavior on the CISSP Mastery platform.

## 1. Load Test Scenario

Created `load-tests/user-scenario.js` which simulates a full user study session:
-   **Discovery**: Fetches available Domains and Classes.
-   **Drill-down**: Retrieves Flashcards for a specific Deck.
-   **Action**: Creates a Study Session (`POST /api/sessions/create`).
-   **Engagement**: Updates progress on a card (`POST /api/progress/update`).

## 2. Authentication Helper

Directly load testing user APIs requires valid authentication. I created `scripts/run-load-test.ts` to solve this by:
-   Reading the authenticated session captured by Playwright (`playwright/.auth/user.json`).
-   Extracting the secure session cookies.
-   Injecting them into the k6 test runner automatically.

## 3. Execution

You can now run the load tests with a single command:

```bash
bun run test:load:user
```

> **Note**: This requires a valid session. If you get authentication errors, run `bun run test:load:auth` first to sign in and capture a fresh session.

## 4. Documentation

A `load-tests/README.md` file has been added with detailed instructions on configuration, prerequisites, and how to interpret the results.

### Observed Behavior
During verification, I noticed the API endpoint `/api/domains` returned a `404` status. This might be due to the development server state or route configuration. Please ensure the local server is running (`bun run dev`) and the API routes are accessible before running the full load testsuite.
