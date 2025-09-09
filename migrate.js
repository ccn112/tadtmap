// migrate.js
// Tự động chạy các file migration SQL trong thư mục migrations khi khởi động
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = path.join(__dirname, 'database.db');
const migrationsDir = path.join(__dirname, 'src', 'modules', 'migrations');

function runMigrations(callback) {
  const db = new sqlite3.Database(dbFile);
  fs.readdir(migrationsDir, (err, files) => {
    if (err) {
      console.error('Không đọc được thư mục migrations:', err);
      callback && callback(err);
      return;
    }
    // Chỉ lấy file .sql, sắp xếp theo tên tăng dần
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    let idx = 0;
    function next() {
      if (idx >= sqlFiles.length) {
        db.close();
        callback && callback();
        return;
      }
      const file = sqlFiles[idx++];
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql, (err) => {
        if (err) {
          console.error(`Lỗi chạy migration ${file}:`, err);
        } else {
          console.log(`Đã chạy migration: ${file}`);
        }
        next();
      });
    }
    next();
  });
}

module.exports = { runMigrations };
