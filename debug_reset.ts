
// debug_reset.ts
async function run() {
    console.log('--- Debugging Forgot Password with TSX/Fetch ---');
    try {
        // 1. Request
        const r1 = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin' })
        });
        const d1 = await r1.json();
        console.log('1. Request Code:', d1);

        if (!d1.debugCode) throw new Error('No code');

        // 2. Reset
        const r2 = await fetch('http://localhost:3000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin', code: d1.debugCode, newPassword: 'adminTsxPass' })
        });
        const d2 = await r2.json();
        console.log('2. Reset:', d2);

        // 3. Login
        const r3 = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: 'admin', password: 'adminTsxPass' })
        });
        const d3 = await r3.json();
        if (r3.status === 200) console.log('3. Login Success:', d3);
        else console.log('3. Login Failed:', r3.status, d3);

    } catch (e) {
        console.error(e);
    }
}
run();
