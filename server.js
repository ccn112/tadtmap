
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./db');
const { registerApi } = require('./Api');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session middleware (simple in-memory session store)
const sessions = new Map();
app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    req.sessionToken = token;
  }
  next();
});

// Khởi tạo database
initDatabase();

// Đăng ký các route API
registerApi(app, db);

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});
app.get('/admin-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log('Database: database.db');
});

// Xử lý tắt server
process.on('SIGINT', () => {
  console.log('\nĐang tắt server...');
  db.close((err) => {
    if (err) {
      console.error('Lỗi khi đóng database:', err.message);
    } else {
      console.log('Đã đóng database.');
    }
    process.exit(0);
  });
});