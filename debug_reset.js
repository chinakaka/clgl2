
// Simulation of Frontend Forgot Password Flow
const fetch = require('node-fetch'); // Assuming node-fetch is available or using native fetch in Node 18+

// Helper wrapper for fetch
const safeFetch = async (url, options) => {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return await res.json();
    } catch (e) {
        console.error(`Fetch Error (${url}):`, e.message);
        throw e;
    }
};

async function runDebug() {
    console.log('--- Starting Forgot Password Flow Debug ---');
    const EMAIL = 'admin';
    const NEW_PASS = 'adminNew123';
    const OLD_PASS = 'admin'; // Or whatever it was

    // 1. Request Reset Code
    console.log(`\n1. Requesting reset code for: ${EMAIL}`);
    const reqRes = await safeFetch('http://localhost:3000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL })
    });

    console.log('Request Response:', reqRes);
    if (!reqRes.success || !reqRes.debugCode) {
        throw new Error('Failed to get debug code');
    }

    const code = reqRes.debugCode;
    console.log(`> Captured Debug Code: ${code}`);

    // 2. Submit Reset
    console.log(`\n2. Submitting reset with code: ${code} and new password: ${NEW_PASS}`);
    const resetRes = await safeFetch('http://localhost:3000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: EMAIL,
            code: code,
            newPassword: NEW_PASS
        })
    });
    console.log('Reset Response:', resetRes);

    // 3. Verify Login
    console.log(`\n3. Verifying login with new password...`);
    const loginRes = await safeFetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            identifier: EMAIL,
            password: NEW_PASS
        })
    });
    console.log('Login Response:', loginRes);
    if (loginRes.email === EMAIL) {
        console.log('>>> SUCCESS: Login confirmed with new password.');
    } else {
        throw new Error('Login failed');
    }

    // 4. Restore Password (Optional, to keep env stable)
    // console.log(`\n4. Restoring original password...`);
    // ... code ...
}

if (!globalThis.fetch) {
    console.error("This script requires Node.js v18+ or 'node-fetch' installed. If failing, rely on curl.");
} else {
    runDebug().catch(e => console.error("Debug Failed:", e));
}
