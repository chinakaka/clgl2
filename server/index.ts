
import express from 'express';
import cors from 'cors';
import { initializeDB, getDB } from './db';
import { RequestStatus, Role } from '../types';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize DB
initializeDB().catch(err => {
    console.error('Failed to initialize DB:', err);
    process.exit(1);
});

// --- Helpers ---
const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// --- In-Memory Store for Reset Codes (Demo Only) ---
const resetCodes = new Map<string, string>();


// --- Routes ---

// Login
app.post('/api/login', async (req, res) => {
    const { identifier, password } = req.body;
    const db = getDB();

    // Simple password check (plain text for demo)
    const user = await db.get('SELECT * FROM users WHERE (email = ? OR id = ?) AND password = ?', identifier, identifier, password || 'password');

    if (user) {
        const { password, ...userWithoutPass } = user;
        res.json(userWithoutPass);
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Register
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    const db = getDB();

    try {
        const newUser = {
            id: `u${Date.now()}`,
            name,
            email,
            role: 'USER',
            password: password || 'password'
        };
        await db.run(
            'INSERT INTO users (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)',
            newUser.id, newUser.name, newUser.email, newUser.role, newUser.password
        );
        const { password: _, ...userWithoutPass } = newUser;
        res.json(userWithoutPass);
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({ error: 'Email already exists' });
        } else {
            res.status(500).json({ error: e.message });
        }
    }
});

// Forgot Password - Request Code
app.post('/api/forgot-password', async (req, res) => {
    const { identifier } = req.body;
    const db = getDB();

    const fs = await import('fs');
    fs.appendFileSync('server_debug.txt', `\n[${new Date().toISOString()}] Request: ${identifier}\n`);

    // Check by email or id
    const user = await db.get('SELECT * FROM users WHERE email = ? OR id = ?', identifier, identifier);
    fs.appendFileSync('server_debug.txt', `Found User: ${JSON.stringify(user)}\n`);

    if (!user) {
        // For security, don't reveal if user exists, but for demo we can be helpful or just pretend success
        return res.json({ success: true, message: 'Verification code sent (simulated)' });
    }

    // Generate simple 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store code mapped to the USER'S EMAIL (stable key)
    resetCodes.set(user.email, code);

    // In a real app, send email here. For demo, return it in response (or log it).
    console.log(`[DEMO] Reset Code for ${user.email} (${user.name}): ${code}`);
    res.json({ success: true, message: 'Verification code sent', debugCode: code });
});

// Reset Password - Verify & Update
app.post('/api/reset-password', async (req, res) => {
    const { identifier, code, newPassword } = req.body;
    const db = getDB();

    // Find user again to get email for code lookup
    const user = await db.get('SELECT * FROM users WHERE email = ? OR id = ?', identifier, identifier);

    if (!user) {
        return res.status(400).json({ error: 'User not found' });
    }

    const storedCode = resetCodes.get(user.email);
    if (!storedCode || storedCode !== code) {
        return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (!newPassword) {
        return res.status(400).json({ error: 'New password is required' });
    }

    await db.run('UPDATE users SET password = ? WHERE id = ?', newPassword, user.id);
    resetCodes.delete(user.email); // Invalidate code

    res.json({ success: true, message: 'Password updated successfully' });
});

// Get Requests
app.get('/api/requests', async (req, res) => {
    const userId = req.query.userId as string;
    const role = req.query.role as string; // 'ADMIN' or 'USER'
    const db = getDB();

    let requests;
    if (role === 'ADMIN') {
        requests = await db.all('SELECT * FROM requests ORDER BY createdAt DESC');
    } else {
        requests = await db.all('SELECT * FROM requests WHERE userId = ? ORDER BY createdAt DESC', userId);
    }

    // Parse JSON fields
    const parsedRequests = requests.map(r => ({
        ...r,
        data: JSON.parse(r.data),
        comments: JSON.parse(r.comments),
        history: JSON.parse(r.history),
        bookingResult: r.bookingResult ? JSON.parse(r.bookingResult) : undefined
    }));

    res.json(parsedRequests);
});

// Get Single Request
app.get('/api/requests/:id', async (req, res) => {
    const db = getDB();
    const request = await db.get('SELECT * FROM requests WHERE id = ?', req.params.id);
    if (!request) return res.status(404).json({ error: 'Not found' });

    res.json({
        ...request,
        data: JSON.parse(request.data),
        comments: JSON.parse(request.comments),
        history: JSON.parse(request.history),
        bookingResult: request.bookingResult ? JSON.parse(request.bookingResult) : undefined
    });
});

// Create Request
app.post('/api/requests', async (req, res) => {
    try {
        const { userId, userName, type, data } = req.body;
        const db = getDB();

        console.log('Received request:', { userId, userName, type });

        const newReq = {
            id: generateId('REQ'),
            userId,
            userName,
            type,
            status: 'SUBMITTED',
            data: JSON.stringify(data),
            comments: JSON.stringify([]),
            history: JSON.stringify([{
                id: generateId('HIST'),
                action: 'CREATED',
                actor: userName,
                timestamp: new Date().toISOString()
            }]),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await db.run(
            `INSERT INTO requests (id, userId, userName, type, status, data, comments, history, createdAt, updatedAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            newReq.id, newReq.userId, newReq.userName, newReq.type, newReq.status, newReq.data, newReq.comments, newReq.history, newReq.createdAt, newReq.updatedAt
        );

        res.json({
            ...newReq,
            data: JSON.parse(newReq.data),
            comments: JSON.parse(newReq.comments),
            history: JSON.parse(newReq.history)
        });
    } catch (error: any) {
        console.error('Create Request Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update Status
app.put('/api/requests/:id/status', async (req, res) => {
    const { status, userId, userName, details } = req.body; // userId/Name of the actor
    const db = getDB();
    const reqId = req.params.id;

    const request = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    if (!request) return res.status(404).json({ error: 'Not found' });

    let history = JSON.parse(request.history);
    history.push({
        id: generateId('HIST'),
        action: `STATUS_CHANGE_TO_${status}`,
        actor: userName,
        timestamp: new Date().toISOString(),
        details
    });

    let assignedTo = request.assignedTo;
    if (status === 'ACCEPTED' && !assignedTo) {
        // Assume admin if accepting
        assignedTo = userId;
    }

    await db.run(
        'UPDATE requests SET status = ?, updatedAt = ?, history = ?, assignedTo = ? WHERE id = ?',
        status, new Date().toISOString(), JSON.stringify(history), assignedTo, reqId
    );

    const updated = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    res.json({
        ...updated,
        data: JSON.parse(updated.data),
        comments: JSON.parse(updated.comments),
        history: JSON.parse(updated.history),
        bookingResult: updated.bookingResult ? JSON.parse(updated.bookingResult) : undefined
    });
});

// Add Comment
app.post('/api/requests/:id/comments', async (req, res) => {
    const { author, role, content } = req.body;
    const db = getDB();
    const reqId = req.params.id;

    const request = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    if (!request) return res.status(404).json({ error: 'Not found' });

    let comments = JSON.parse(request.comments);
    const newComment = {
        id: generateId('CMT'),
        author,
        role,
        content,
        createdAt: new Date().toISOString()
    };
    comments.push(newComment);

    await db.run('UPDATE requests SET comments = ? WHERE id = ?', JSON.stringify(comments), reqId);
    res.json(newComment);
});


// Complete Booking (Book request)
app.post('/api/requests/:id/booking', async (req, res) => {
    const { userId, userName, resultData } = req.body;
    const db = getDB();
    const reqId = req.params.id;

    const request = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    if (!request) return res.status(404).json({ error: 'Not found' });

    let history = JSON.parse(request.history);
    history.push({
        id: generateId('HIST'),
        action: 'BOOKING_COMPLETED',
        actor: userName,
        timestamp: new Date().toISOString()
    });

    const bookingResult = {
        ...resultData,
        files: resultData.files || []
    };

    await db.run(
        'UPDATE requests SET status = ?, updatedAt = ?, history = ?, bookingResult = ? WHERE id = ?',
        'SUCCESS', new Date().toISOString(), JSON.stringify(history), JSON.stringify(bookingResult), reqId
    );

    const updated = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    res.json({
        ...updated,
        data: JSON.parse(updated.data),
        comments: JSON.parse(updated.comments),
        history: JSON.parse(updated.history),
        bookingResult: JSON.parse(updated.bookingResult)
    });
});

// Update Booking Files
app.put('/api/requests/:id/booking/files', async (req, res) => {
    const { userId, userName, files } = req.body;
    const db = getDB();
    const reqId = req.params.id;

    const request = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (!request.bookingResult) return res.status(400).json({ error: 'No booking result to update' });

    let bookingResult = JSON.parse(request.bookingResult);
    bookingResult.files = files;

    let history = JSON.parse(request.history);
    history.push({
        id: generateId('HIST'),
        action: 'FILES_UPDATED',
        actor: userName,
        timestamp: new Date().toISOString(),
        details: '管理员修改了预定附件'
    });

    await db.run(
        'UPDATE requests SET bookingResult = ?, updatedAt = ?, history = ? WHERE id = ?',
        JSON.stringify(bookingResult), new Date().toISOString(), JSON.stringify(history), reqId
    );

    const updated = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    res.json({
        ...updated,
        data: JSON.parse(updated.data),
        comments: JSON.parse(updated.comments),
        history: JSON.parse(updated.history),
        bookingResult: JSON.parse(updated.bookingResult)
    });
});

// Fail Booking
app.post('/api/requests/:id/fail', async (req, res) => {
    const { userId, userName, reason } = req.body;
    const db = getDB();
    const reqId = req.params.id;

    const request = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    if (!request) return res.status(404).json({ error: 'Not found' });

    let history = JSON.parse(request.history);
    history.push({
        id: generateId('HIST'),
        action: 'BOOKING_FAILED',
        actor: userName,
        timestamp: new Date().toISOString(),
        details: reason
    });

    const bookingResult = { failureReason: reason };

    await db.run(
        'UPDATE requests SET status = ?, updatedAt = ?, history = ?, bookingResult = ? WHERE id = ?',
        'FAILED', new Date().toISOString(), JSON.stringify(history), JSON.stringify(bookingResult), reqId
    );

    const updated = await db.get('SELECT * FROM requests WHERE id = ?', reqId);
    res.json({
        ...updated,
        data: JSON.parse(updated.data),
        comments: JSON.parse(updated.comments),
        history: JSON.parse(updated.history),
        bookingResult: JSON.parse(updated.bookingResult)
    });
});

// Delete Requests
app.post('/api/requests/delete', async (req, res) => {
    const { ids } = req.body;
    const db = getDB();

    // ids is array of strings
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'Invalid ids' });

    const placeholders = ids.map(() => '?').join(',');
    await db.run(`DELETE FROM requests WHERE id IN (${placeholders})`, ...ids);

    res.json({ success: true });
});

// Reimbursements

app.get('/api/reimbursements', async (req, res) => {
    const userId = req.query.userId as string;
    const role = req.query.role as string;
    const db = getDB();

    let items;
    if (role === 'ADMIN') {
        items = await db.all('SELECT * FROM reimbursements ORDER BY createdAt DESC');
    } else {
        items = await db.all('SELECT * FROM reimbursements WHERE userId = ? ORDER BY createdAt DESC', userId);
    }

    const parsed = items.map(r => ({
        ...r,
        attachments: r.attachments ? JSON.parse(r.attachments) : []
    }));
    res.json(parsed);
});

app.post('/api/reimbursements', async (req, res) => {
    const { userId, userName, amount, category, description, date, attachments } = req.body;
    const db = getDB();

    const newRmb = {
        id: generateId('RMB'),
        userId,
        userName,
        amount,
        category,
        description,
        date,
        attachments: JSON.stringify(attachments || []),
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };

    await db.run(
        `INSERT INTO reimbursements (id, userId, userName, amount, category, description, date, attachments, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        newRmb.id, newRmb.userId, newRmb.userName, newRmb.amount, newRmb.category, newRmb.description, newRmb.date, newRmb.attachments, newRmb.status, newRmb.createdAt
    );

    res.json({
        ...newRmb,
        attachments: JSON.parse(newRmb.attachments)
    });
});

app.put('/api/reimbursements/:id/status', async (req, res) => {
    const { status, userName, reason } = req.body; // userName is admin name
    const db = getDB();
    const id = req.params.id;

    let updates = 'status = ?';
    let params = [status];

    if (status === 'APPROVED') {
        updates += ', approvedBy = ?';
        params.push(userName);
    } else if (status === 'REJECTED') {
        updates += ', rejectionReason = ?';
        params.push(reason);
    }

    params.push(id);

    await db.run(`UPDATE reimbursements SET ${updates} WHERE id = ?`, ...params);

    const updated = await db.get('SELECT * FROM reimbursements WHERE id = ?', id);
    res.json({
        ...updated,
        attachments: updated.attachments ? JSON.parse(updated.attachments) : []
    });
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
