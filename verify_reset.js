
const fetch = require('node-fetch'); // Might not be installed? In recent node, fetch is global? 
// Checking server/index.ts, it uses express. 
// If node version is recent (v18+), fetch is global.
// Let's try native fetch.

async function test() {
    try {
        console.log('1. Requesting Reset Code...');
        const res1 = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin' })
        });
        const data1 = await res1.json();
        console.log('Result 1:', data1);

        if (!data1.debugCode) {
            console.error('No debug code returned');
            return;
        }

        const code = data1.debugCode;
        console.log('Got Code:', code);

        console.log('2. Resetting Password...');
        const res2 = await fetch('http://localhost:3000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin', code, newPassword: 'newAdminPassword123' })
        });
        const data2 = await res2.json();
        console.log('Result 2:', data2);

        console.log('3. Logging in with new password...');
        const res3 = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'admin', password: 'newAdminPassword123' })
        });

        if (res3.status === 200) {
            console.log('Login Success!');
        } else {
            console.log('Login Failed:', res3.status);
        }

    } catch (e) {
        console.error(e);
    }
}

test();
