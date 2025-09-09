
// Api.js
// Định nghĩa các route API, nhận vào app và db
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

function registerApi(app, db) {
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
    // if (!parcel_code || !title || !geometry) {
    //   res.status(400).json({ error: 'Mã thửa đất, tiêu đề và hình học là bắt buộc' });
    //   return;
    // }
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
    // Lấy tất cả trường của bảng parcels từ req.body
    const fields = [
      'parcel_code','project_id','title','area','person_in_charge','legal_status','clearance_status','parcel_color','description',
      'land_use_purpose','owner','sheet_number','parcel_number','red_book_number','purchased_area','outside_area','field','full_address','hamlet','ward','province',
      'expected_unit_price','expected_total_price','expected_broker_fee','expected_notary_fee','expected_total_cost','transaction_status','purchased_area_actual','outside_area_actual','total_purchased_area','transfer_doc_status','name_transfer_status','transferee','unit_price','total_price','deposit','payment','broker_fee','notary_fee','total_cost','other_cost','yield_bonus','kpi_bonus','total_bonus','geometry','attachment'
    ];
    const updates = [];
    const values = [];
    fields.forEach(f => {
      if (f in req.body) {
        updates.push(`${f} = ?`);
        values.push(req.body[f]);
      }
    });
    if (!req.body.parcel_code) {
      res.status(400).json({ error: 'Mã thửa đất là bắt buộc' });
      return;
    }
    if (updates.length === 0) {
      res.status(400).json({ error: 'Không có trường nào để cập nhật' });
      return;
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE parcels SET ${updates.join(', ')} WHERE id = ?`;
    values.push(req.params.id);
    const stmt = db.prepare(sql);
    stmt.run(values, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Không tìm thấy thửa đất' });
        return;
      }
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
// Cập nhật nhanh thửa đất (chỉ mã thửa)
  app.put('/api/qparcels/:id', (req, res) => {
    const { parcel_code, project_id, title, area, description, attachment, person_in_charge, legal_status, clearance_status, parcel_color, geometry } = req.body;
    if (!parcel_code) {
      res.status(400).json({ error: 'Mã thửa đất' });
      return;
    }
    const stmt = db.prepare(`UPDATE parcels SET 
      parcel_code = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`);
    stmt.run([
      parcel_code,
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
      const sessionToken = require('crypto').createHash('sha256').update(user.id + Date.now() + 'secret').digest('hex');
      db.run('UPDATE users SET session_token = ?, last_login = ? WHERE id = ?',
        [sessionToken, new Date().toISOString(), user.id], (err) => {
        if (err) {
          console.error('Error updating session:', err);
          res.status(500).json({ error: 'Lỗi tạo session' });
          return;
        }
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
    const token = req.sessionToken;
    console.log('Auth verify request - token:', token);
    if (!token) {
      console.log('No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }
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
  app.post('/api/auth/logout', (req, res) => {
    const token = req.sessionToken;
    if (token) {
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
      const workbook = require('xlsx').readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = require('xlsx').utils.sheet_to_json(worksheet);
      let updatedCount = 0;
      let errors = [];
      data.forEach((row, index) => {
        try {
          const { parcel_code, title, area, description, person_in_charge, legal_status, clearance_status } = row;
          if (!parcel_code) {
            errors.push(`Dòng ${index + 2}: Thiếu mã thửa đất`);
            return;
          }
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
        if (currentVertices.length >= 3) {
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
              parcel_code: `DXF${Date.now()}${polylineCount}`,
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
        const x = parseFloat(lines[i + 1]);
        i++;
        if (lines[i + 1] === '20') {
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
  function calculateAreaFromVertices(vertices) {
    if (vertices.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < vertices.length - 1; i++) {
      area += vertices[i].x * vertices[i + 1].y;
      area -= vertices[i + 1].x * vertices[i].y;
    }
    area = Math.abs(area) / 2;
    return Math.round(area * 100) / 100;
  }
  function getRandomColor() {
    const colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

module.exports = {
  registerApi
};
