
// using global fetch

const API_BASE = 'http://localhost:3000/api';
const USER_ID = 'u1'; // 王员工

async function verify() {
    console.log('Starting verification...');

    // 1. Create a reimbursement
    console.log('Creating reimbursement...');
    const createRes = await fetch(`${API_BASE}/reimbursements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: USER_ID,
            userName: 'Verification User',
            amount: 100,
            category: 'MEALS',
            description: 'Test Reimbursement for Deletion',
            date: new Date().toISOString().split('T')[0],
            attachments: []
        })
    });

    if (!createRes.ok) {
        console.error('Failed to create reimbursement:', await createRes.text());
        process.exit(1);
    }

    const created = await createRes.json();
    console.log('Created reimbursement:', created.id);

    // 2. Verify it exists
    console.log('Verifying existence...');
    const listRes = await fetch(`${API_BASE}/reimbursements?userId=${USER_ID}`);
    const list = await listRes.json();
    const exists = list.find((r: any) => r.id === created.id);
    if (!exists) {
        console.error('Reimbursement not found in list after creation');
        process.exit(1);
    }
    console.log('Reimbursement exists.');

    // 3. Delete it
    console.log('Deleting reimbursement...');
    const deleteRes = await fetch(`${API_BASE}/reimbursements/${created.id}?userId=${USER_ID}`, {
        method: 'DELETE'
    });

    if (!deleteRes.ok) {
        console.error('Failed to delete reimbursement:', await deleteRes.text());
        process.exit(1);
    }
    console.log('Delete request successful.');

    // 4. Verify it's gone
    console.log('Verifying removal...');
    const listRes2 = await fetch(`${API_BASE}/reimbursements?userId=${USER_ID}`);
    const list2 = await listRes2.json();
    const stillExists = list2.find((r: any) => r.id === created.id);
    if (stillExists) {
        console.error('Reimbursement still exists after deletion!');
        process.exit(1);
    }
    console.log('Reimbursement successfully removed.');

    console.log('Verification PASSED.');
}

verify().catch(console.error);
