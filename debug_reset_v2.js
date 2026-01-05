
const http = require('http');

function postRequest(urlStr, data) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(body));
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${body}`));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('--- Debugging Forgot Password with Native HTTP ---');

    try {
        // 1. Request Code
        console.log('1. Requesting Code for admin...');
        const res1 = await postRequest('http://localhost:3000/api/forgot-password', JSON.stringify({ email: 'admin' }));
        console.log('Response:', res1);
        const code = res1.debugCode;
        if (!code) throw new Error('No debug code received');

        // 2. Reset
        console.log(`2. Resetting with code ${code}...`);
        const res2 = await postRequest('http://localhost:3000/api/reset-password', JSON.stringify({
            email: 'admin',
            code: code,
            newPassword: 'adminDebugPass'
        }));
        console.log('Response:', res2);

        // 3. Login
        console.log('3. Logging in with new password...');
        const res3 = await postRequest('http://localhost:3000/api/login', JSON.stringify({
            identifier: 'admin',
            password: 'adminDebugPass'
        }));
        console.log('Login Success:', res3);

    } catch (e) {
        console.error('FAILED:', e.message);
    }
}

run();
