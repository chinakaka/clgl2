
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Initial data (same as mockService to bootstrap)
// We will insert these if the DB is empty
const INITIAL_USERS = [
    { id: 'admin', name: '系统管理员', email: 'admin', role: 'ADMIN', password: 'password' }, // Default password
    { id: 'u1', name: '王员工', email: 'user@corp.com', role: 'USER', password: 'password' },
];

let db: Database;

export const initializeDB = async () => {
    db = await open({
        filename: path.join(process.cwd(), 'server', 'database.sqlite'),
        driver: sqlite3.Database
    });

    // Create tables
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            password TEXT NOT NULL, -- In real app, hash this!
            avatar TEXT
        );

        CREATE TABLE IF NOT EXISTS requests (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            type TEXT NOT NULL,
            status TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON
            comments TEXT NOT NULL, -- JSON
            history TEXT NOT NULL, -- JSON
            bookingResult TEXT, -- JSON
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            assignedTo TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS reimbursements (
            id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            userName TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            attachments TEXT, -- JSON
            status TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            approvedBy TEXT,
            rejectionReason TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS user_profiles (
            userId TEXT PRIMARY KEY,
            data TEXT, -- JSON string of UserProfile
            FOREIGN KEY (userId) REFERENCES users(id)
        );
    `);

    // Seed if empty
    const userCount = await db.get('SELECT count(*) as count FROM users');
    if (userCount.count === 0) {
        console.log('Seeding initial users...');
        for (const user of INITIAL_USERS) {
            await db.run(
                'INSERT INTO users (id, name, email, role, password) VALUES (?, ?, ?, ?, ?)',
                user.id, user.name, user.email, user.role, user.password
            );
        }
    }

    console.log('Database initialized');
};

export const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db;
};
