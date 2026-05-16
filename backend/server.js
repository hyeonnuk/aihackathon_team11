require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_NAME = process.env.DB_NAME || 'synccs';

let pool;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function normalizeUserPayload(body) {
  return {
    name: body.name?.trim(),
    studentNumber: body.studentNumber?.trim(),
    gender: body.gender?.trim(),
    phoneNumber: body.phoneNumber?.trim(),
    email: body.email?.trim().toLowerCase(),
    loginId: body.loginId?.trim(),
    password: body.password,
  };
}

async function initDatabase() {
  if (!/^[a-zA-Z0-9_]+$/.test(DB_NAME)) {
    throw new Error('DB_NAME can only contain letters, numbers, and underscores.');
  }

  const baseConnection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  await baseConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`,
  );
  await baseConnection.end();

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(50) NOT NULL,
      student_number VARCHAR(30) NOT NULL,
      gender ENUM('male', 'female', 'other') NOT NULL,
      phone_number VARCHAR(30) NOT NULL,
      email VARCHAR(255) NOT NULL,
      login_id VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_users_student_number (student_number),
      UNIQUE KEY uk_users_email (email),
      UNIQUE KEY uk_users_login_id (login_id)
    )
  `);
}

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend and database are running.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed.' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const user = normalizeUserPayload(req.body);
  const requiredFields = [
    'name',
    'studentNumber',
    'gender',
    'phoneNumber',
    'email',
    'loginId',
    'password',
  ];

  const missingFields = requiredFields.filter((field) => isBlank(user[field]));
  if (missingFields.length > 0) {
    return res.status(400).json({
      message: 'Required fields are missing.',
      fields: missingFields,
    });
  }

  if (!['male', 'female', 'other'].includes(user.gender)) {
    return res.status(400).json({
      message: 'Gender must be one of male, female, or other.',
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (user.password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }

  try {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const [result] = await pool.query(
      `
        INSERT INTO users
          (name, student_number, gender, phone_number, email, login_id, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user.name,
        user.studentNumber,
        user.gender,
        user.phoneNumber,
        user.email,
        user.loginId,
        passwordHash,
      ],
    );

    return res.status(201).json({
      message: 'Signup completed.',
      user: {
        id: result.insertId,
        name: user.name,
        studentNumber: user.studentNumber,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        email: user.email,
        loginId: user.loginId,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Student number, email, or login id already exists.',
      });
    }

    console.error('Signup failed:', error);
    return res.status(500).json({ message: 'Signup failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const loginId = req.body.loginId?.trim();
  const password = req.body.password;

  if (isBlank(loginId) || isBlank(password)) {
    return res.status(400).json({ message: 'Login id and password are required.' });
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT id, name, student_number, gender, phone_number, email, login_id, password_hash
        FROM users
        WHERE login_id = ?
        LIMIT 1
      `,
      [loginId],
    );

    const foundUser = rows[0];
    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid login id or password.' });
    }

    const passwordMatches = await bcrypt.compare(password, foundUser.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid login id or password.' });
    }

    const token = jwt.sign(
      {
        userId: foundUser.id,
        loginId: foundUser.login_id,
      },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '2h' },
    );

    return res.json({
      message: 'Login completed.',
      token,
      user: {
        id: foundUser.id,
        name: foundUser.name,
        studentNumber: foundUser.student_number,
        gender: foundUser.gender,
        phoneNumber: foundUser.phone_number,
        email: foundUser.email,
        loginId: foundUser.login_id,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Login failed.' });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
