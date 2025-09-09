
// db.js
// Xử lý kết nối và khởi tạo database, các hàm thao tác DB
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');

function initDatabase() {
    // Thêm trường created_at cho bảng parcels nếu chưa có
    db.all("PRAGMA table_info(parcels)", (err, columns) => {
      if (err) {
        console.error('Lỗi kiểm tra cột parcels:', err);
        return;
      }
      if (!columns.some(c => c.name === 'created_at')) {
        db.run("ALTER TABLE parcels ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
          if (err) {
            console.error('Lỗi khi thêm cột created_at vào parcels:', err);
          } else {
            console.log('Đã thêm cột created_at vào bảng parcels');
          }
        });
      }
    });
    // Danh sách các trường mới cần bổ sung cho bảng parcels
    const newParcelColumns = [
      { name: 'land_use_purpose', type: 'TEXT' },
      { name: 'owner', type: 'TEXT' },
      { name: 'sheet_number', type: 'TEXT' },
      { name: 'parcel_number', type: 'TEXT' },
      { name: 'red_book_number', type: 'TEXT' },
      { name: 'purchased_area', type: 'REAL' },
      { name: 'outside_area', type: 'REAL' },
      { name: 'field', type: 'TEXT' },
      { name: 'full_address', type: 'TEXT' },
      { name: 'hamlet', type: 'TEXT' },
      { name: 'ward', type: 'TEXT' },
      { name: 'province', type: 'TEXT' },
      { name: 'expected_unit_price', type: 'REAL' },
      { name: 'expected_total_price', type: 'REAL' },
      { name: 'expected_broker_fee', type: 'REAL' },
      { name: 'expected_notary_fee', type: 'REAL' },
      { name: 'expected_total_cost', type: 'REAL' },
      { name: 'transaction_status', type: 'TEXT' },
      { name: 'purchased_area_actual', type: 'REAL' },
      { name: 'outside_area_actual', type: 'REAL' },
      { name: 'total_purchased_area', type: 'REAL' },
      { name: 'transfer_doc_status', type: 'TEXT' },
      { name: 'name_transfer_status', type: 'TEXT' },
      { name: 'transferee', type: 'TEXT' },
      { name: 'unit_price', type: 'REAL' },
      { name: 'total_price', type: 'REAL' },
      { name: 'deposit', type: 'REAL' },
      { name: 'payment', type: 'REAL' },
      { name: 'broker_fee', type: 'REAL' },
      { name: 'notary_fee', type: 'REAL' },
      { name: 'total_cost', type: 'REAL' },
      { name: 'other_cost', type: 'REAL' },
      { name: 'yield_bonus', type: 'REAL' },
      { name: 'kpi_bonus', type: 'REAL' },
      { name: 'total_bonus', type: 'REAL' }
    ];
    db.all("PRAGMA table_info(parcels)", (err, columns) => {
      if (err) {
        console.error('Lỗi kiểm tra cột parcels:', err);
        return;
      }
      newParcelColumns.forEach(col => {
        if (!columns.some(c => c.name === col.name)) {
          db.run(`ALTER TABLE parcels ADD COLUMN ${col.name} ${col.type}`,(err) => {
            if (err) {
              console.error(`Lỗi khi thêm cột ${col.name} vào parcels:`, err);
            } else {
              console.log(`Đã thêm cột ${col.name} vào bảng parcels`);
            }
          });
        }
      });
    });
  db.serialize(() => {
    // Tạo bảng projects
    db.run(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.all("PRAGMA table_info(projects)", (err, columns) => {
        if (err) {
          console.error('Lỗi kiểm tra cột:', err);
          return;
        }
        const hasProjectCode = columns.some(col => col.name === 'project_code');
        const code = columns.some(col => col.name === 'code');
        if (!hasProjectCode) {
          db.run("ALTER TABLE projects ADD COLUMN project_code TEXT DEFAULT '125'", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột project_code:', err);
            } else {
              console.log('Đã thêm cột project_code vào bảng projects');
            }
          });
        }
        if (!code) {
          db.run("ALTER TABLE projects ADD COLUMN code TEXT DEFAULT '125'", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột code:', err);
            } else {
              console.log('Đã thêm cột code vào bảng projects');
            }
          });
        }
      });

    // Tạo bảng users
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_token TEXT,
      last_login DATETIME
    )`);

    // Tạo bảng user_project_permissions
    db.run(`CREATE TABLE IF NOT EXISTS user_project_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      can_view BOOLEAN DEFAULT 1,
      can_edit BOOLEAN DEFAULT 0,
      can_delete BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Tạo bảng parcels với cột project_id và parcel_color
    db.run(`CREATE TABLE IF NOT EXISTS parcels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parcel_code TEXT UNIQUE NOT NULL,
      project_id INTEGER,
      title TEXT NOT NULL,
      area REAL,
      description TEXT,
      attachment TEXT,
      person_in_charge TEXT,
      legal_status TEXT DEFAULT 'Chưa có',
      clearance_status TEXT DEFAULT 'Chưa GP',
      parcel_color TEXT DEFAULT '#3388ff',
      geometry TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )`);

    // Kiểm tra và thêm cột parcel_color nếu chưa có
    db.get("PRAGMA table_info(parcels)", (err, rows) => {
      if (err) {
        console.error('Lỗi kiểm tra cấu trúc bảng:', err);
        return;
      }
      db.all("PRAGMA table_info(parcels)", (err, columns) => {
        if (err) {
          console.error('Lỗi kiểm tra cột:', err);
          return;
        }
        const hasParcelColor = columns.some(col => col.name === 'parcel_color');
        const hasProjectId = columns.some(col => col.name === 'project_id');
        const hasParcelCode = columns.some(col => col.name === 'parcel_code');
        if (!hasParcelColor) {
          db.run("ALTER TABLE parcels ADD COLUMN parcel_color TEXT DEFAULT '#3388ff'", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột parcel_color:', err);
            } else {
              console.log('Đã thêm cột parcel_color vào bảng parcels');
            }
          });
        }
        if (!hasParcelCode) {
          db.run("ALTER TABLE parcels ADD COLUMN parcel_code TEXT DEFAULT '123321'", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột parcel_code:', err);
            } else {
              console.log('Đã thêm cột parcel_code vào bảng parcels');
            }
          });
        }
        if (!hasProjectId) {
          db.run("ALTER TABLE parcels ADD COLUMN project_id INTEGER", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột project_id:', err);
            } else {
              console.log('Đã thêm cột project_id vào bảng parcels');
            }
          });
        }
      });
    });

    // Kiểm tra và thêm cột session_token và last_login cho bảng users
    db.get("PRAGMA table_info(users)", (err, rows) => {
      if (err) {
        console.error('Lỗi kiểm tra cấu trúc bảng users:', err);
        return;
      }
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('Lỗi kiểm tra cột users:', err);
          return;
        }
        const hasSessionToken = columns.some(col => col.name === 'session_token');
        const hasLastLogin = columns.some(col => col.name === 'last_login');
        if (!hasSessionToken) {
          db.run("ALTER TABLE users ADD COLUMN session_token TEXT", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột session_token:', err);
            } else {
              console.log('Đã thêm cột session_token vào bảng users');
            }
          });
        }
        if (!hasLastLogin) {
          db.run("ALTER TABLE users ADD COLUMN last_login DATETIME", (err) => {
            if (err) {
              console.error('Lỗi khi thêm cột last_login:', err);
            } else {
              console.log('Đã thêm cột last_login vào bảng users');
            }
          });
        }
      });
    });

    // Tạo dữ liệu mẫu nếu bảng trống
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err) {
        console.error('Lỗi kiểm tra dữ liệu users:', err);
        return;
      }
      if (row.count === 0) {
        console.log('Tạo dữ liệu mẫu...');
        const adminPassword = require('crypto').createHash('sha256').update('123123123').digest('hex');
        db.run(`INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)`,
          ['admin@tadt.vn', adminPassword, 'Super Admin', 'superadmin'], function(err) {
          if (err) {
            console.error('Lỗi tạo admin:', err);
            return;
          }
          const adminId = this.lastID;
          console.log('Đã tạo superadmin:', adminId);
          db.run(`INSERT INTO projects (code, name, description, location) VALUES (?, ?, ?, ?)`,
            ['PRJ001', 'Dự án mẫu', 'Dự án mẫu để test hệ thống', 'Hà Nội'], function(err) {
            if (err) {
              console.error('Lỗi tạo project:', err);
              return;
            }
            const projectId = this.lastID;
            console.log('Đã tạo project mẫu:', projectId);
            const sampleData = [
              {
                title: 'Thửa đất A1',
                area: 150.5,
                description: 'Thửa đất mẫu đầu tiên',
                attachment: '',
                person_in_charge: 'Nguyễn Văn A',
                legal_status: 'Đã xong',
                clearance_status: 'Đã xong',
                parcel_color: '#51cf66',
                geometry: JSON.stringify({
                  type: 'Polygon',
                  coordinates: [[
                    [105.8, 21.0],
                    [105.9, 21.0],
                    [105.9, 21.1],
                    [105.8, 21.1],
                    [105.8, 21.0]
                  ]]
                })
              },
              {
                title: 'Thửa đất B2',
                area: 200.0,
                description: 'Thửa đất mẫu thứ hai',
                attachment: '',
                person_in_charge: 'Trần Thị B',
                legal_status: 'Đang xin',
                clearance_status: 'Đang GP',
                parcel_color: '#ffd43b',
                geometry: JSON.stringify({
                  type: 'Polygon',
                  coordinates: [[
                    [105.85, 21.05],
                    [105.95, 21.05],
                    [105.95, 21.15],
                    [105.85, 21.15],
                    [105.85, 21.05]
                  ]]
                })
              },
              {
                title: 'Thửa đất C3',
                area: 120.75,
                description: 'Thửa đất mẫu thứ ba',
                attachment: '',
                person_in_charge: 'Lê Văn C',
                legal_status: 'Chưa có',
                clearance_status: 'Chưa GP',
                parcel_color: '#ff6b6b',
                geometry: JSON.stringify({
                  type: 'Polygon',
                  coordinates: [[
                    [105.75, 21.02],
                    [105.85, 21.02],
                    [105.85, 21.12],
                    [105.75, 21.12],
                    [105.75, 21.02]
                  ]]
                })
              }
            ];
            const stmt = db.prepare(`INSERT INTO parcels 
              (parcel_code, project_id, title, area, description, attachment, person_in_charge, legal_status, clearance_status, parcel_color, geometry) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            sampleData.forEach(parcel => {
              stmt.run([
                `P${projectId}${parcel.title.replace(/\s+/g, '')}`,
                projectId,
                parcel.title,
                parcel.area,
                parcel.description,
                parcel.attachment,
                parcel.person_in_charge,
                parcel.legal_status,
                parcel.clearance_status,
                parcel.parcel_color,
                parcel.geometry
              ]);
            });
            stmt.finalize();
            db.run(`INSERT INTO user_project_permissions (user_id, project_id, can_view, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)`,
              [adminId, projectId, 1, 1, 1]);
            console.log('Đã tạo dữ liệu mẫu thành công!');
          });
        });
      }
    });
  });
}

module.exports = {
  db,
  initDatabase
};
