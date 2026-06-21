const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  db.serialize(() => {
    // Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT NOT NULL,
        otp TEXT,
        otpExpires DATETIME,
        registration_no TEXT,
        phone TEXT,
        college_id TEXT
      )
    `);

    // Mock Tests Table
    db.run(`
      CREATE TABLE IF NOT EXISTS mock_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        access_code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        start_time DATETIME NOT NULL,
        duration_minutes INTEGER NOT NULL
      )
    `);

    // Questions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        description TEXT NOT NULL,
        timeComplexity TEXT NOT NULL,
        spaceComplexity TEXT NOT NULL,
        examples TEXT NOT NULL,
        defaultCode TEXT NOT NULL,
        FOREIGN KEY(test_id) REFERENCES mock_tests(id)
      )
    `);

    // MCQ Questions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS mcq_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        question_text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_option INTEGER NOT NULL,
        FOREIGN KEY(test_id) REFERENCES mock_tests(id)
      )
    `);

    // Submissions Table
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(test_id) REFERENCES mock_tests(id)
      )
    `);

    // Login History
    db.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        email TEXT,
        status TEXT,
        ip_address TEXT,
        device TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Allowed Students (For Registration Verification)
    db.run(`
      CREATE TABLE IF NOT EXISTS allowed_students (
        registration_no TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        college_id TEXT NOT NULL,
        is_registered BOOLEAN DEFAULT 0
      )
    `, () => {
      // Seed a mock student for testing
      db.run(`INSERT OR IGNORE INTO allowed_students (registration_no, name, college_id) VALUES ('STU-2026-001', 'Kedar Guduru', 'col-123')`);
    });
  });
};

initDb();

module.exports = db;
