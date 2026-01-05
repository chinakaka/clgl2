
// verify_flexible.ts
async function run() {
    console.log('--- Testing Forgot Password with "admin" (Username) ---');
    try {
        const resetPass = 'adminFlex123';
        const identifier = 'admin'; // Testing username login

        // 1. Request Code
        const r1 = await fetch('http://localhost:3000/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier })
        });
        const d1 = await r1.json();
        console.log('1. Request Code (Identifier: admin):', d1);
        if (!d1.debugCode) throw new Error('No code received');

        // 2. Reset Password
        const r2 = await fetch('http://localhost:3000/api/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, code: d1.debugCode, newPassword: resetPass })
        });
        const d2 = await r2.json();
        console.log('2. Reset Password:', d2);
        if (!d2.success) throw new Error('Reset failed');

        // 3. Login with New Password
        const r3 = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password: resetPass })
        });
        const d3 = await r3.json();
        if (r3.status === 200) {
            console.log('3. Login Success:', d3);
            console.log('>>> VERIFICATION PASSED: Admin reset via username works.');
        } else {
            console.log('3. Login Failed:', r3.status, d3);
        }

    } catch (e: any) {
        console.error('FAILED:', e.message);
    }
}
run();
