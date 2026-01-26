import * as fs from 'fs';
import * as path from 'path';

const token = process.argv[2];

if (!token) {
    console.error('❌ Please provide the __session cookie value as an argument.');
    console.error('Usage: bun run scripts/create-auth-manually.ts <YOUR_SESSION_COOKIE_VALUE>');
    process.exit(1);
}

const authDir = path.join(process.cwd(), 'playwright', '.auth');
const authFile = path.join(authDir, 'user.json');

// Ensure directory exists
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}

const authData = {
    cookies: [
        {
            name: "__session",
            value: token,
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: "Lax"
        },
        {
            name: "__client_uat",
            value: "1766214512", // Dummy value
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: "Strict"
        }
    ],
    origins: []
};

fs.writeFileSync(authFile, JSON.stringify(authData, null, 2));

console.log('✅ Created auth file manually at:', authFile);
console.log('🚀 You can now run: bun run test:load:user');
