# Load Tests

This directory contains k6 load tests for the application.

## Prerequisites

1.  **Install k6**:
    -   Windows: `winget install k6` or download from [k6.io](https://k6.io/docs/get-started/installation/)
    -   MacOS: `brew install k6`
    -   Linux: `sudo apt-get install k6`

2.  **Authentication**:
    Most tests require an authenticated user session. We use the same session capture as the E2E tests.

    Run this command and follow the instructions to sign in (you only need to do this once or when your session expires):
    ```bash
    bun run test:load:auth
    ```

## Running Tests

### User Journey Test
Simulates a user browsing classes, selecting a deck, creating a study session, and studying cards.

```bash
bun run test:load:user
```

This script (`scripts/run-load-test.ts`) automatically:
1.  Reads the session from `playwright/.auth/user.json`.
2.  Passes it to the k6 script.
3.  Runs `load-tests/user-scenario.js`.

### Basic Smoke Test
A simple test to check if the homepage is up.

```bash
bun run test:load
```

## Configuration

Both scripts can be configured by editing the `options` object in the respective files:
-   `load-tests/user-scenario.js`
-   `load-tests/basic-test.js`

Key options:
-   `vus`: Number of Virtual Users.
-   `duration`: How long to run the test.
-   `stages`: Define ramp-up and ramp-down patterns.
