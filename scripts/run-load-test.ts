import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const AUTH_FILE = path.join(process.cwd(), 'playwright', '.auth', 'user.json');

async function runLoadTest() {
    console.log('🚀 Preparing to run load test...');

    // 1. Check for auth file
    if (!fs.existsSync(AUTH_FILE)) {
        console.error('❌ Authentication file not found!');
        console.error('👉 Please run "bun run scripts/capture-auth-session.ts" first to login.');
        process.exit(1);
    }

    // 2. Read and parse auth file
    try {
        const authData = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
        const cookies = authData.cookies;

        if (!cookies || !Array.isArray(cookies)) {
            throw new Error('Invalid auth file format: cookies missing');
        }

        // 3. Extract relevant cookies
        // We only use __session to match the successful curl command.
        // Including __client_uat or others might trigger strict validation/mismatches in Clerk.
        const sessionCookie = cookies.find(c => c.name === '__session');

        if (!sessionCookie) {
            console.warn('⚠️ No __session cookie found in auth file!');
        }

        const cookieString = sessionCookie ? `${sessionCookie.name}=${sessionCookie.value}` : '';

        console.log(`✅ Prepared auth cookie: ${cookieString.substring(0, 20)}...`);

        // 4. Run k6
        const k6Script = process.argv[2] || 'load-tests/user-scenario.js';
        console.log(`running ${k6Script}`);

        const k6 = spawn('k6', ['run', '-e', `AUTH_COOKIE=${cookieString}`, k6Script], {
            stdio: 'inherit',
            shell: false
        });

        k6.on('close', (code) => {
            console.log(`\nLoad test finished with code ${code}`);
            process.exit(code ?? 0);
        });

    } catch (error) {
        console.error('❌ Error reading auth file:', error);
        process.exit(1);
    }
}

runLoadTest();
