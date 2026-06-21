require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'skillforge_super_secret_key_2026';


const app = express();
app.use(cors());
app.use(express.json());

const db = require('./db');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Simple decryption: reverse shift, then base64 decode
const decryptPayload = (encryptedStr) => {
  try {
    // Unshift characters by 3
    let unshifted = '';
    for (let i = 0; i < encryptedStr.length; i++) {
      unshifted += String.fromCharCode(encryptedStr.charCodeAt(i) - 3);
    }
    // Base64 decode
    const buffer = Buffer.from(unshifted, 'base64');
    return buffer.toString('utf-8');
  } catch (err) {
    return null;
  }
};

// Intercept Imports function for hidden features
const interceptImports = (language, code) => {
  let modifiedCode = code;
  let intercepted = false;

  if (language === 'python') {
    if (code.includes('import os')) {
      modifiedCode = modifiedCode.replace(/import os/g, 'import sys\nclass MockOS:\n  def system(self, cmd):\n    print("Access Denied: os.system is blocked")\nos = MockOS()');
      intercepted = true;
    }
  } else if (language === 'javascript') {
    if (code.includes('require("child_process")') || code.includes("require('child_process')")) {
      modifiedCode = modifiedCode.replace(/require\(['"]child_process['"]\)/g, '{ exec: () => console.log("Access Denied") }');
      intercepted = true;
    }
  }
  
  return { modifiedCode, intercepted };
};

const sendResponse = (res, result, startTime) => {
  const endTime = performance.now();
  const timeTaken = (endTime - startTime).toFixed(2); // in ms
  // Approximated memory usage in KB
  const approxMemoryKB = Math.floor(Math.random() * 8000 + 12000); // 12000-20000 KB simulated
  
  res.json({
    ...result,
    time: timeTaken,
    memory: approxMemoryKB
  });
};

const executePython = (filePath, inputPath, res, startTime) => {
  const cmd = inputPath ? `python "${filePath}" < "${inputPath}"` : `python "${filePath}"`;
  exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    fs.unlinkSync(filePath);
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (error) {
       if (error.killed) return sendResponse(res, { error: "Execution Timeout (5s limit)" }, startTime);
       return sendResponse(res, { error: stderr || error.message, stdout }, startTime);
    }
    sendResponse(res, { output: stdout, error: stderr }, startTime);
  });
};

const executeJava = (filePath, inputPath, res, className, startTime) => {
  const dirPath = path.dirname(filePath);
  exec(`javac "${filePath}"`, { timeout: 5000 }, (compileError, compileStdout, compileStderr) => {
    if (compileError) {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return sendResponse(res, { error: compileStderr || compileError.message }, startTime);
    }
    
    const cmd = inputPath ? `java -cp "${dirPath}" ${className} < "${inputPath}"` : `java -cp "${dirPath}" ${className}`;
    exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      const classFilePath = path.join(dirPath, `${className}.class`);
      if (fs.existsSync(classFilePath)) fs.unlinkSync(classFilePath);
      
      if (error) {
          if (error.killed) return sendResponse(res, { error: "Execution Timeout (5s limit)" }, startTime);
          return sendResponse(res, { error: stderr || error.message, stdout }, startTime);
      }
      sendResponse(res, { output: stdout, error: stderr }, startTime);
    });
  });
};

const executeCSharp = (filePath, inputPath, res, exePath, startTime) => {
  exec(`csc -out:"${exePath}" "${filePath}"`, { timeout: 5000 }, (compileError, compileStdout, compileStderr) => {
    if (compileError) {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return sendResponse(res, { error: compileStdout || compileStderr || compileError.message }, startTime);
    }
    
    const cmd = inputPath ? `"${exePath}" < "${inputPath}"` : `"${exePath}"`;
    exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
      
      if (error) {
          if (error.killed) return sendResponse(res, { error: "Execution Timeout (5s limit)" }, startTime);
          return sendResponse(res, { error: stderr || error.message, stdout }, startTime);
      }
      sendResponse(res, { output: stdout, error: stderr }, startTime);
    });
  });
};

const executeCpp = (filePath, inputPath, res, exePath, startTime) => {
  exec(`g++ "${filePath}" -o "${exePath}"`, { timeout: 5000 }, (compileError, compileStdout, compileStderr) => {
    if (compileError) {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      return sendResponse(res, { error: compileStderr || compileError.message }, startTime);
    }
    
    const cmd = inputPath ? `"${exePath}" < "${inputPath}"` : `"${exePath}"`;
    exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      fs.unlinkSync(filePath);
      if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
      
      if (error) {
          if (error.killed) return sendResponse(res, { error: "Execution Timeout (5s limit)" }, startTime);
          return sendResponse(res, { error: stderr || error.message, stdout }, startTime);
      }
      sendResponse(res, { output: stdout, error: stderr }, startTime);
    });
  });
};

const executeJS = (filePath, inputPath, res, startTime) => {
  const cmd = inputPath ? `node "${filePath}" < "${inputPath}"` : `node "${filePath}"`;
  exec(cmd, { timeout: 5000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    fs.unlinkSync(filePath);
    if (inputPath && fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (error) {
       if (error.killed) return sendResponse(res, { error: "Execution Timeout (5s limit)" }, startTime);
       return sendResponse(res, { error: stderr || error.message, stdout }, startTime);
    }
    sendResponse(res, { output: stdout, error: stderr }, startTime);
  });
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

app.post('/api/request-otp', (req, res) => {
  const { email, role } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    const otp = generateOTP();
    const expires = new Date(Date.now() + 5 * 60000).toISOString();
    
    const sendEmailAndRespond = () => {
      const mailOptions = {
        from: process.env.SMTP_EMAIL,
        to: email,
        subject: 'Your Login OTP',
        text: `Your OTP for login is: ${otp}\nIt is valid for 5 minutes.`
      };
      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) return res.status(500).json({ error: 'Failed to send email' });
        res.json({ message: 'OTP sent to your email' });
      });
    };

    if (!user) {
      // Auto-create user
      db.run("INSERT INTO users (email, role, otp, otpExpires, username) VALUES (?, ?, ?, ?, ?)", [email, role || 'student', otp, expires, email.split('@')[0]], (insertErr) => {
        if (insertErr) return res.status(500).json({ error: 'Failed to create user' });
        sendEmailAndRespond();
      });
    } else {
      db.run("UPDATE users SET otp = ?, otpExpires = ?, role = ? WHERE email = ?", [otp, expires, role || user.role, email], (updateErr) => {
        if (updateErr) return res.status(500).json({ error: 'Failed to update OTP' });
        sendEmailAndRespond();
      });
    }
  });
});

// --- Auth Endpoints ---

app.post('/api/request-otp', (req, res) => {
  const { email, role } = req.body;
  const otp = generateOTP();
  const expires = new Date(Date.now() + 10 * 60000); // 10 mins
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (!user) {
      db.run("INSERT INTO users (email, role, otp, otpExpires, username) VALUES (?, ?, ?, ?, ?)", [email, role || 'student', otp, expires, email.split('@')[0]]);
    } else {
      db.run("UPDATE users SET otp = ?, otpExpires = ?, role = ? WHERE id = ?", [otp, expires, role || user.role, user.id]);
    }

    console.log(`[DEV MODE] OTP for ${email} is ${otp}`);
    res.json({ message: 'OTP sent securely to email.' });
  });
});

app.post('/api/verify-student-reg', (req, res) => {
  const { registration_no } = req.body;
  if (!registration_no) return res.status(400).json({ error: 'Registration number is required' });

  db.get("SELECT * FROM allowed_students WHERE registration_no = ?", [registration_no], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row) return res.status(404).json({ error: 'Registration number not found in college records. Please contact your College Administrator.' });
    if (row.is_registered) return res.status(400).json({ error: 'This registration number is already registered.' });
    
    res.json({ message: 'Verified successfully', studentInfo: { name: row.name, college_id: row.college_id } });
  });
});

app.post('/api/verify-auth', (req, res) => {
  const { authMode, email, password, otp, role, registration_no, name, college_id } = req.body;
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    
    if (authMode === 'signup') {
      if (['admin', 'college', 'tutor'].includes(role)) {
        return res.status(403).json({ error: 'Registration disabled from public UI. Please contact the system owner.' });
      }
      if (role === 'student' && !registration_no) {
        return res.status(400).json({ error: 'Registration number required for student sign up.' });
      }
      
      if (user) {
        if (!user.otp || user.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });
        if (new Date() > new Date(user.otpExpires)) return res.status(401).json({ error: 'OTP expired' });
        
        db.run("UPDATE users SET password = ?, role = ?, registration_no = ?, username = ?, college_id = ?, otp = NULL, otpExpires = NULL WHERE id = ?", 
          [password, role, registration_no, name, college_id, user.id], (err) => {
          if (err) return res.status(500).json({ error: 'Failed to complete signup' });
          
          if (registration_no) {
            db.run("UPDATE allowed_students SET is_registered = 1 WHERE registration_no = ?", [registration_no]);
          }
          
          const token = jwt.sign({ id: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '8h' });
          db.run("INSERT INTO login_history (user_id, email, status) VALUES (?, ?, ?)", [user.id, user.email, 'SUCCESS']);
          
          res.json({ message: 'Account created successfully', token, user: { ...user, password, role, username: name } });
        });
      } else {
        return res.status(400).json({ error: 'OTP flow violated. No user record found.' });
      }
    } else {
      // SIGN IN
      if (!user) {
        db.run("INSERT INTO login_history (email, status) VALUES (?, ?)", [email, 'FAILED_USER_NOT_FOUND']);
        return res.status(404).json({ error: 'Account not found' });
      }
      if (user.password && user.password !== password) {
        db.run("INSERT INTO login_history (user_id, email, status) VALUES (?, ?, ?)", [user.id, email, 'FAILED_INVALID_PASSWORD']);
        return res.status(401).json({ error: 'Incorrect password' });
      }
      if (!user.otp || user.otp !== otp) {
        db.run("INSERT INTO login_history (user_id, email, status) VALUES (?, ?, ?)", [user.id, email, 'FAILED_INVALID_OTP']);
        return res.status(401).json({ error: 'Invalid OTP' });
      }
      if (new Date() > new Date(user.otpExpires)) {
        return res.status(401).json({ error: 'OTP expired' });
      }

      db.run("UPDATE users SET otp = NULL, otpExpires = NULL WHERE id = ?", [user.id]);
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
      db.run("INSERT INTO login_history (user_id, email, status) VALUES (?, ?, ?)", [user.id, user.email, 'SUCCESS']);
      
      res.json({ message: 'Login successful', token, user });
    }
  });
});

app.post('/api/admin/tests', (req, res) => {
  const { access_code, title, start_time, duration_minutes } = req.body;
  db.run("INSERT INTO mock_tests (access_code, title, start_time, duration_minutes) VALUES (?, ?, ?, ?)",
    [access_code, title, start_time, duration_minutes],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create test' });
      res.json({ id: this.lastID, access_code, title, start_time, duration_minutes });
    }
  );
});

app.get('/api/admin/users', (req, res) => {
  db.all("SELECT id, username, email, role FROM users", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch users' });
    res.json(rows);
  });
});

app.post('/api/admin/users', (req, res) => {
  const { username, email, role, registration_no, phone, college_id } = req.body;
  db.run("INSERT INTO users (username, email, role, registration_no, phone, college_id) VALUES (?, ?, ?, ?, ?, ?)", [username, email, role, registration_no, phone, college_id], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to create user' });
    res.json({ id: this.lastID, username, email, role });
  });
});

app.post('/api/admin/users/bulk', (req, res) => {
  const { users } = req.body;
  const stmt = db.prepare("INSERT INTO users (username, email, role, registration_no, phone, college_id) VALUES (?, ?, ?, ?, ?, ?)");
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    users.forEach(u => {
      stmt.run([u.username, u.email, u.role, u.registration_no, u.phone, u.college_id]);
    });
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) return res.status(500).json({ error: 'Bulk insert failed' });
      res.json({ message: 'Users added successfully' });
    });
  });
});

app.post('/api/admin/questions', (req, res) => {
  const { test_id, title, difficulty, description, timeComplexity, spaceComplexity, examples, defaultCode } = req.body;
  db.run(`INSERT INTO questions (test_id, title, difficulty, description, timeComplexity, spaceComplexity, examples, defaultCode) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [test_id, title, difficulty, description, timeComplexity, spaceComplexity, JSON.stringify(examples), JSON.stringify(defaultCode)],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add question' });
      res.json({ id: this.lastID, message: 'Question added successfully' });
    }
  );
});

app.post('/api/admin/mcq', (req, res) => {
  const { test_id, category, question_text, options, correct_option } = req.body;
  db.run(`INSERT INTO mcq_questions (test_id, category, question_text, options, correct_option) VALUES (?, ?, ?, ?, ?)`,
    [test_id, category, question_text, JSON.stringify(options), correct_option],
    function(err) {
      if (err) return res.status(500).json({ error: 'Failed to add MCQ' });
      res.json({ id: this.lastID, message: 'MCQ added successfully' });
    }
  );
});

app.get('/api/admin/tests', (req, res) => {
  db.all("SELECT * FROM mock_tests", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tests' });
    res.json(rows);
  });
});

app.get('/api/tests/:accessCode', (req, res) => {
  const code = req.params.accessCode;
  db.get("SELECT * FROM mock_tests WHERE access_code = ?", [code], (err, test) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    const now = new Date();
    const startTime = new Date(test.start_time);
    if (now < startTime) {
      return res.status(403).json({ error: `Test has not started yet. Starts at ${startTime.toLocaleString()}` });
    }

    db.all("SELECT * FROM questions WHERE test_id = ?", [test.id], (err, questions) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch questions' });
      
      const parsedQuestions = questions.map(q => ({
        ...q,
        examples: JSON.parse(q.examples),
        defaultCode: JSON.parse(q.defaultCode)
      }));

      db.all("SELECT * FROM mcq_questions WHERE test_id = ?", [test.id], (err, mcqs) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch MCQs' });
        
        const parsedMcqs = mcqs.map(m => ({
          ...m,
          options: JSON.parse(m.options)
        }));

        res.json({ test, questions: parsedQuestions, mcqs: parsedMcqs });
      });
    });
  });
});

// Student Endpoints
app.get('/api/student/tests', (req, res) => {
  // Return all mock tests (since in this mock we aren't heavily enforcing college mapping yet)
  db.all("SELECT * FROM mock_tests", (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch tests' });
    res.json(rows);
  });
});

app.get('/api/student/results', (req, res) => {
  const { user_id } = req.query;
  db.all(`
    SELECT s.*, m.title as test_title, m.duration_minutes 
    FROM submissions s 
    JOIN mock_tests m ON s.test_id = m.id 
    WHERE s.user_id = ?
  `, [user_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch results' });
    res.json(rows);
  });
});

app.post('/api/student/submit', (req, res) => {
  const { user_id, test_id, status, mcq_answers } = req.body;
  
  // Calculate MCQ score if answers provided
  if (mcq_answers && Object.keys(mcq_answers).length > 0) {
    db.all("SELECT id, correct_option FROM mcq_questions WHERE test_id = ?", [test_id], (err, mcqs) => {
      if (err) return res.status(500).json({ error: 'Failed to score test' });
      
      let score = 0;
      mcqs.forEach(m => {
        if (mcq_answers[m.id] === m.correct_option) score += 1;
      });
      
      const statusWithScore = `${status} (MCQ: ${score}/${mcqs.length})`;
      
      db.run("INSERT INTO submissions (user_id, test_id, status) VALUES (?, ?, ?)", [user_id, test_id, statusWithScore], function(err) {
        if (err) return res.status(500).json({ error: 'Failed to submit exam' });
        res.json({ success: true, submission_id: this.lastID, mcq_score: score, mcq_total: mcqs.length });
      });
    });
  } else {
    db.run("INSERT INTO submissions (user_id, test_id, status) VALUES (?, ?, ?)", [user_id, test_id, status], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to submit exam' });
      res.json({ success: true, submission_id: this.lastID });
    });
  }
});

// College Endpoints
app.get('/api/college/students', (req, res) => {
  const { college_id } = req.query;
  db.all("SELECT id, username, email, phone, registration_no FROM users WHERE role = 'student' AND college_id = ?", [college_id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch students' });
    res.json(rows);
  });
});

// Tutor Endpoints
app.get('/api/tutor/submissions', (req, res) => {
  db.all(`
    SELECT s.*, m.title as test_title, u.username as student_name, u.email as student_email
    FROM submissions s 
    JOIN mock_tests m ON s.test_id = m.id 
    JOIN users u ON s.user_id = u.id
    ORDER BY s.submitted_at DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch submissions' });
    res.json(rows);
  });
});

app.post('/execute', async (req, res) => {
  const { language, payload, stdin } = req.body; // payload is encrypted code
  if (!language || !payload) {
    return res.status(400).json({ error: 'Language and encrypted payload are required' });
  }

  const startTime = performance.now();
  const code = decryptPayload(payload);
  const inputStr = stdin ? decryptPayload(stdin) : '';
  
  if (!code) {
    return sendResponse(res, { error: 'Failed to decrypt payload. Security violation detected.' }, startTime);
  }

  const { modifiedCode } = interceptImports(language, code);
  const jobId = uuidv4();

  let filePath;
  let inputPath = null;
  try {
    if (inputStr) {
      inputPath = path.join(TEMP_DIR, `${jobId}.in`);
      fs.writeFileSync(inputPath, inputStr);
    }

    if (language === 'python') {
      filePath = path.join(TEMP_DIR, `${jobId}.py`);
      fs.writeFileSync(filePath, modifiedCode);
      executePython(filePath, inputPath, res, startTime);
    } else if (language === 'java') {
      const match = modifiedCode.match(/public\s+class\s+([A-Za-z0-9_]+)/);
      const className = match ? match[1] : 'Main';
      filePath = path.join(TEMP_DIR, `${className}.java`);
      fs.writeFileSync(filePath, modifiedCode);
      executeJava(filePath, inputPath, res, className, startTime);
    } else if (language === 'csharp') {
      filePath = path.join(TEMP_DIR, `${jobId}.cs`);
      const exePath = path.join(TEMP_DIR, `${jobId}.exe`);
      fs.writeFileSync(filePath, modifiedCode);
      executeCSharp(filePath, inputPath, res, exePath, startTime);
    } else if (language === 'cpp') {
      filePath = path.join(TEMP_DIR, `${jobId}.cpp`);
      const exePath = path.join(TEMP_DIR, `${jobId}.exe`);
      fs.writeFileSync(filePath, modifiedCode);
      executeCpp(filePath, inputPath, res, exePath, startTime);
    } else if (language === 'javascript') {
      filePath = path.join(TEMP_DIR, `${jobId}.js`);
      fs.writeFileSync(filePath, modifiedCode);
      executeJS(filePath, inputPath, res, startTime);
    } else {
      res.status(400).json({ error: 'Unsupported language' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Execution Server running on port ${PORT}`);
});
