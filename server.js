const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
  origin: true, // Allow all origins
  credentials: true // Allow credentials
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Session middleware (simple in-memory session store)
const sessions = new Map();

app.use((req, res, next) => {
  // Add session info to request if available
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    req.sessionToken = token;
  }
  next();
});

// Cấu hình multer cho upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Khởi tạo database
const db = new sqlite3.Database('database.db');

// Tạo bảng projects
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
      
      if (!hasParcelColor) {
        db.run("ALTER TABLE parcels ADD COLUMN parcel_color TEXT DEFAULT '#3388ff'", (err) => {
          if (err) {
            console.error('Lỗi khi thêm cột parcel_color:', err);
          } else {
            console.log('Đã thêm cột parcel_color vào bảng parcels');
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
      
      // Tạo superadmin
      const adminPassword = require('crypto').createHash('sha256').update('123123123').digest('hex');
      db.run(`INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, ?)`, 
        ['admin@tadt.vn', adminPassword, 'Super Admin', 'superadmin'], function(err) {
        if (err) {
          console.error('Lỗi tạo admin:', err);
          return;
        }
        
        const adminId = this.lastID;
        console.log('Đã tạo superadmin:', adminId);
        
        // Tạo project mẫu
        db.run(`INSERT INTO projects (code, name, description, location) VALUES (?, ?, ?, ?)`, 
          ['PRJ001', 'Dự án mẫu', 'Dự án mẫu để test hệ thống', 'Hà Nội'], function(err) {
          if (err) {
            console.error('Lỗi tạo project:', err);
            return;
          }
          
          const projectId = this.lastID;
          console.log('Đã tạo project mẫu:', projectId);
          
          // Tạo thửa đất mẫu
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
          
          // Cấp quyền cho admin
          db.run(`INSERT INTO user_project_permissions (user_id, project_id, can_view, can_edit, can_delete) VALUES (?, ?, ?, ?, ?)`,
            [adminId, projectId, 1, 1, 1]);
          
          console.log('Đã tạo dữ liệu mẫu thành công!');
        });
      });
    }
  });
});

// API Routes

// Lấy tất cả thửa đất
app.get('/api/parcels', (req, res) => {
  db.all("SELECT * FROM parcels ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Lấy thửa đất theo ID
app.get('/api/parcels/:id', (req, res) => {
  db.get("SELECT * FROM parcels WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy thửa đất' });
      return;
    }
    res.json(row);
  });
});

// Tạo thửa đất mới
app.post('/api/parcels', (req, res) => {
  const { parcel_code, project_id, title, area, description, attachment, person_in_charge, legal_status, clearance_status, parcel_color, geometry } = req.body;
  
  if (!parcel_code || !title || !geometry) {
    res.status(400).json({ error: 'Mã thửa đất, tiêu đề và hình học là bắt buộc' });
    return;
  }

  const stmt = db.prepare(`INSERT INTO parcels 
    (parcel_code, project_id, title, area, description, attachment, person_in_charge, legal_status, clearance_status, parcel_color, geometry) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  stmt.run([
    parcel_code,
    project_id || null,
    title,
    area || 0,
    description || '',
    attachment || '',
    person_in_charge || '',
    legal_status || 'Chưa có',
    clearance_status || 'Chưa GP',
    parcel_color || '#3388ff',
    geometry
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Lấy thửa đất vừa tạo
    db.get("SELECT * FROM parcels WHERE id = ?", [this.lastID], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json(row);
    });
  });

  stmt.finalize();
});

// Cập nhật thửa đất
app.put('/api/parcels/:id', (req, res) => {
  const { parcel_code, project_id, title, area, description, attachment, person_in_charge, legal_status, clearance_status, parcel_color, geometry } = req.body;
  
  if (!parcel_code || !title || !geometry) {
    res.status(400).json({ error: 'Mã thửa đất, tiêu đề và hình học là bắt buộc' });
    return;
  }

  const stmt = db.prepare(`UPDATE parcels SET 
    parcel_code = ?, project_id = ?, title = ?, area = ?, description = ?, attachment = ?, person_in_charge = ?, 
    legal_status = ?, clearance_status = ?, parcel_color = ?, geometry = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?`);

  stmt.run([
    parcel_code,
    project_id || null,
    title,
    area || 0,
    description || '',
    attachment || '',
    person_in_charge || '',
    legal_status || 'Chưa có',
    clearance_status || 'Chưa GP',
    parcel_color || '#ffd43b',
    geometry,
    req.params.id
  ], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Không tìm thấy thửa đất' });
      return;
    }
    
    // Lấy thửa đất đã cập nhật
    db.get("SELECT * FROM parcels WHERE id = ?", [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });

  stmt.finalize();
});

// Xóa thửa đất
app.delete('/api/parcels/:id', (req, res) => {
  db.run("DELETE FROM parcels WHERE id = ?", [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Không tìm thấy thửa đất' });
      return;
    }
    
    res.json({ message: 'Đã xóa thửa đất thành công' });
  });
});

// API Projects
app.get('/api/projects', (req, res) => {
  db.all("SELECT * FROM projects ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/projects', (req, res) => {
  const { code, name, description, location } = req.body;
  
  if (!code || !name) {
    res.status(400).json({ error: 'Mã dự án và tên dự án là bắt buộc' });
    return;
  }

  db.run(`INSERT INTO projects (code, name, description, location) VALUES (?, ?, ?, ?)`, 
    [code, name, description || '', location || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({ id: this.lastID, code, name, description, location });
  });
});

// API Users
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    return;
  }

  const hashedPassword = require('crypto').createHash('sha256').update(password).digest('hex');
  
  db.get("SELECT * FROM users WHERE email = ? AND password = ?", [email, hashedPassword], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!user) {
      res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
      return;
    }
    
    // Tạo session token đơn giản (trong production nên dùng JWT)
    const sessionToken = require('crypto').createHash('sha256').update(user.id + Date.now() + 'secret').digest('hex');
    
    // Lưu session vào database (hoặc cache)
    db.run('UPDATE users SET session_token = ?, last_login = ? WHERE id = ?', 
      [sessionToken, new Date().toISOString(), user.id], (err) => {
      if (err) {
        console.error('Error updating session:', err);
        res.status(500).json({ error: 'Lỗi tạo session' });
        return;
      }
      
      // Không trả về password
      delete user.password;
      res.json({
        ...user,
        sessionToken: sessionToken
      });
    });
  });
});

app.get('/api/users', (req, res) => {
  db.all('SELECT id, email, full_name as name, role, created_at FROM users ORDER BY id DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { email, password, name, role } = req.body;
  
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, mật khẩu và họ tên là bắt buộc' });
    return;
  }

  const hashedPassword = require('crypto').createHash('sha256').update(password).digest('hex');
  
  db.run(`INSERT INTO users (email, password, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)`, 
    [email, hashedPassword, name, role || 'user', new Date().toISOString()], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.status(201).json({ id: this.lastID, email, name, role: role || 'user' });
  });
});

// API Permissions
app.get('/api/permissions', (req, res) => {
  db.all('SELECT * FROM user_project_permissions ORDER BY id DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/permissions', (req, res) => {
  const { user_id, project_id, can_view, can_edit } = req.body;
  
  db.run('INSERT INTO user_project_permissions (user_id, project_id, can_view, can_edit, created_at) VALUES (?, ?, ?, ?, ?)',
    [user_id, project_id, can_view ? 1 : 0, can_edit ? 1 : 0, new Date().toISOString()],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, message: 'Permission created successfully' });
    }
  );
});

// API Auth Verify
app.get('/api/auth/verify', (req, res) => {
  const token = req.sessionToken; // Use sessionToken from middleware
  
  console.log('Auth verify request - token:', token);
  
  if (!token) {
    console.log('No token provided');
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  
  // Verify session token
  db.get('SELECT id, email, full_name as name, role, session_token FROM users WHERE session_token = ?', [token], (err, row) => {
    if (err) {
      console.log('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      console.log('Invalid token:', token);
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    console.log('User found:', row);
    res.json({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role
    });
  });
});

// API Logout
app.post('/api/auth/logout', (req, res) => {
  const token = req.sessionToken; // Use sessionToken from middleware
  
  if (token) {
    // Clear session token
    db.run('UPDATE users SET session_token = NULL WHERE session_token = ?', [token], (err) => {
      if (err) {
        console.error('Error clearing session:', err);
      }
    });
  }
  
  res.json({ message: 'Logged out successfully' });
});

// Upload file
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Không có file được upload' });
    return;
  }
  
  res.json({ 
    filename: req.file.filename,
    path: req.file.path 
  });
});

// Import Excel data to update parcels
app.post('/api/import-excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Không có file được upload' });
    return;
  }

  if (!req.file.originalname.toLowerCase().endsWith('.xlsx') && 
      !req.file.originalname.toLowerCase().endsWith('.xls')) {
    res.status(400).json({ error: 'Chỉ hỗ trợ file Excel (.xlsx, .xls)' });
    return;
  }

  try {
    // Đọc file Excel và parse dữ liệu
    const workbook = require('xlsx').readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = require('xlsx').utils.sheet_to_json(worksheet);

    let updatedCount = 0;
    let errors = [];

    // Xử lý từng dòng dữ liệu
    data.forEach((row, index) => {
      try {
        const { parcel_code, title, area, description, person_in_charge, legal_status, clearance_status } = row;
        
        if (!parcel_code) {
          errors.push(`Dòng ${index + 2}: Thiếu mã thửa đất`);
          return;
        }

        // Cập nhật thửa đất theo mã
        db.run(`UPDATE parcels SET 
          title = ?, area = ?, description = ?, person_in_charge = ?, 
          legal_status = ?, clearance_status = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE parcel_code = ?`, 
          [title || '', area || 0, description || '', person_in_charge || '', 
           legal_status || 'Chưa có', clearance_status || 'Chưa GP', parcel_code],
          function(err) {
            if (err) {
              errors.push(`Dòng ${index + 2}: ${err.message}`);
            } else if (this.changes > 0) {
              updatedCount++;
            } else {
              errors.push(`Dòng ${index + 2}: Không tìm thấy thửa đất với mã ${parcel_code}`);
            }
          });
      } catch (error) {
        errors.push(`Dòng ${index + 2}: ${error.message}`);
      }
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: `Import thành công ${updatedCount} thửa đất`,
      updatedCount,
      errors
    });

  } catch (error) {
    console.error('Lỗi import Excel:', error);
    res.status(500).json({ error: 'Lỗi khi import file Excel: ' + error.message });
  }
});

// Parse DXF file and convert to GeoJSON
app.post('/api/parse-dxf', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Không có file được upload' });
    return;
  }

  if (!req.file.originalname.toLowerCase().endsWith('.dxf')) {
    res.status(400).json({ error: 'Chỉ hỗ trợ file DXF' });
    return;
  }

  try {
    const dxfContent = fs.readFileSync(req.file.path, 'utf8');
    const geojson = parseDXFToGeoJSON(dxfContent);
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json(geojson);
  } catch (error) {
    console.error('Lỗi parse DXF:', error);
    res.status(500).json({ error: 'Lỗi khi parse file DXF: ' + error.message });
  }
});

// DXF Parser function
function parseDXFToGeoJSON(dxfContent) {
  const lines = dxfContent.split('\n').map(line => line.trim());
  const features = [];
  let currentPolyline = null;
  let currentVertices = [];
  let inPolyline = false;
  let inVertex = false;
  let polylineCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line === 'POLYLINE') {
      inPolyline = true;
      currentPolyline = { vertices: [] };
      polylineCount++;
    } else if (line === 'VERTEX' && inPolyline) {
      inVertex = true;
    } else if (line === 'SEQEND' && inPolyline) {
      // End of polyline, create feature
      if (currentVertices.length >= 3) {
        // Close the polygon by adding first vertex at the end
        currentVertices.push(currentVertices[0]);
        
        const feature = {
          type: 'Feature',
          properties: {
            title: `Thửa đất ${polylineCount}`,
            area: calculateAreaFromVertices(currentVertices),
            description: `Thửa đất được import từ DXF - ${polylineCount}`,
            person_in_charge: '',
            legal_status: 'Chưa có',
            clearance_status: 'Chưa GP',
            parcel_color: getRandomColor()
          },
          geometry: {
            type: 'Polygon',
            coordinates: [currentVertices.map(vertex => [vertex.x, vertex.y])]
          }
        };
        features.push(feature);
      }
      
      inPolyline = false;
      inVertex = false;
      currentVertices = [];
      currentPolyline = null;
    } else if (inVertex && line === '10') {
      // X coordinate
      const x = parseFloat(lines[i + 1]);
      i++;
      if (lines[i + 1] === '20') {
        // Y coordinate
        const y = parseFloat(lines[i + 2]);
        i += 2;
        currentVertices.push({ x, y });
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features: features
  };
}

// Calculate area from vertices (simplified)
function calculateAreaFromVertices(vertices) {
  if (vertices.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    area += vertices[i].x * vertices[i + 1].y;
    area -= vertices[i + 1].x * vertices[i].y;
  }
  area = Math.abs(area) / 2;
  
  // Convert to reasonable units (assuming coordinates are in meters)
  return Math.round(area * 100) / 100;
}

// Generate random color for parcels
function getRandomColor() {
  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin routes
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