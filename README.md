# TADT Map - Quản lý thửa đất trên bản đồ

Ứng dụng web quản lý thửa đất với bản đồ tương tác, hỗ trợ import file AutoCAD (DXF) và GeoJSON, quản lý thông tin thửa đất với SQLite database.

## Tính năng chính

### 🗺️ **Quản lý bản đồ**
- Hiển thị bản đồ với Leaflet
- Hỗ trợ vẽ polygon thủ công
- Chỉnh sửa hình dạng thửa đất
- Tô màu theo trạng thái pháp lý và GPMB

### 📁 **Import dữ liệu**
- Hỗ trợ file GeoJSON
- Hỗ trợ file DXF (đang phát triển)
- Tự động tạo thửa đất từ file import
- Tính toán diện tích tự động

### 🏠 **Quản lý thửa đất**
- Thêm/sửa/xóa thửa đất
- Thông tin chi tiết: tiêu đề, diện tích, mô tả
- Người phụ trách và file đính kèm
- Tình trạng pháp lý và GPMB
- Màu sắc tùy chỉnh cho từng thửa đất
- Lưu trữ hình học dưới dạng GeoJSON

### 🎨 **Giao diện**
- Sidebar hiển thị danh sách thửa đất
- Modal form chỉnh sửa thông tin
- Responsive design cho mobile
- Filter theo trạng thái
- Popup thông tin trên bản đồ

## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js (version 14 trở lên)
- npm hoặc yarn

### Bước 1: Clone và cài đặt dependencies
```bash
git clone <repository-url>
cd tadtmap
npm install
```

### Bước 2: Chạy ứng dụng
```bash
npm start
```

Ứng dụng sẽ chạy tại: `http://localhost:3000`

### Bước 3: Sử dụng
1. Mở trình duyệt và truy cập `http://localhost:3000`
2. Sử dụng các chức năng:
   - **Import**: Upload file GeoJSON để tạo thửa đất
   - **Thêm thửa đất**: Vẽ polygon và nhập thông tin
   - **Chỉnh sửa**: Click đúp vào thửa đất hoặc chọn từ sidebar
   - **Xóa**: Chọn thửa đất và nhấn nút xóa

## Cấu trúc dự án

```
tadtmap/
├── public/
│   ├── index.html      # Giao diện chính
│   ├── styles.css      # CSS styles
│   └── app.js          # JavaScript frontend
├── uploads/            # Thư mục lưu file đính kèm
├── sample_parcels.geojson  # File GeoJSON mẫu
├── server.js           # Express backend server
├── database.db         # SQLite database (tự động tạo)
├── package.json        # Dependencies
└── README.md           # Hướng dẫn này
```

## Công nghệ sử dụng

### Frontend
- **HTML5**: Giao diện chính
- **CSS3**: Styling và responsive design
- **Vanilla JavaScript**: Logic ứng dụng
- **Leaflet**: Thư viện bản đồ
- **Leaflet.draw**: Plugin vẽ polygon

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **SQLite3**: Database
- **Multer**: File upload handling

### Database Schema

Bảng `parcels`:
```sql
CREATE TABLE parcels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Thửa đất
- `GET /api/parcels` - Lấy tất cả thửa đất
- `GET /api/parcels/:id` - Lấy thửa đất theo ID
- `POST /api/parcels` - Tạo thửa đất mới
- `PUT /api/parcels/:id` - Cập nhật thửa đất
- `DELETE /api/parcels/:id` - Xóa thửa đất

### File upload
- `POST /api/upload` - Upload file đính kèm

## Hướng dẫn sử dụng

### 1. Import dữ liệu
1. Chuẩn bị file GeoJSON với các polygon (sử dụng file `sample_parcels.geojson` mẫu)
2. Click "Import DXF/GeoJSON"
3. Chọn file và nhập tiêu đề chung
4. Hệ thống sẽ tự động tạo thửa đất với thông tin từ file

### 2. Thêm thửa đất thủ công
1. Click "Thêm thửa đất"
2. Vẽ polygon trên bản đồ
3. Nhập thông tin trong form
4. Click "Lưu"

### 3. Chỉnh sửa thửa đất
1. Click đúp vào thửa đất trên bản đồ
2. Hoặc chọn từ sidebar và click "Sửa"
3. Chỉnh sửa thông tin
4. Click "Lưu"

### 4. Vẽ và chỉnh sửa hình dạng
- **Vẽ**: Click "Vẽ polygon" và vẽ trên bản đồ
- **Sửa**: Chọn thửa đất, click "Sửa" và kéo các điểm
- **Xóa**: Chọn thửa đất và click "Xóa"

### 5. Filter và tìm kiếm
- Sử dụng dropdown trong sidebar để lọc theo:
  - Tình trạng pháp lý
  - Tình trạng GPMB

## Màu sắc và trạng thái

### Tình trạng pháp lý
- 🟡 **Chưa có**: Màu vàng
- 🔵 **Đang xin**: Màu xanh dương
- 🟢 **Đã xong**: Màu xanh lá

### Tình trạng GPMB
- 🔴 **Chưa GP**: Màu đỏ
- 🟡 **Đang GP**: Màu vàng
- 🟢 **Đã xong**: Màu xanh lá

## Phát triển

### Chế độ development
```bash
npm run dev
```

### Cấu trúc code
- **TadtMap class**: Class chính quản lý toàn bộ ứng dụng
- **Event handlers**: Xử lý các sự kiện từ UI
- **API calls**: Giao tiếp với backend
- **Map management**: Quản lý bản đồ và layers

### Mở rộng tính năng
1. **DXF Parser**: Implement parser cho file AutoCAD
2. **Export**: Thêm chức năng export dữ liệu
3. **Authentication**: Thêm hệ thống đăng nhập
4. **Multi-user**: Hỗ trợ nhiều người dùng
5. **Version control**: Lưu lịch sử thay đổi

## Troubleshooting

### Lỗi thường gặp

1. **Database không tạo được**
   - Kiểm tra quyền ghi trong thư mục
   - Đảm bảo SQLite3 đã cài đặt

2. **Bản đồ không hiển thị**
   - Kiểm tra kết nối internet
   - Kiểm tra console browser có lỗi gì

3. **Import file không hoạt động**
   - Kiểm tra định dạng file (GeoJSON)
   - Kiểm tra cấu trúc dữ liệu

4. **Port 3000 đã được sử dụng**
   - Thay đổi port trong `server.js`
   - Hoặc tắt ứng dụng khác đang chạy trên port 3000

### Logs
- Server logs: Hiển thị trong terminal
- Client logs: Mở Developer Tools > Console

## Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## Hỗ trợ

Nếu gặp vấn đề hoặc có câu hỏi:
1. Kiểm tra phần Troubleshooting
2. Tạo Issue trên GitHub
3. Liên hệ team phát triển

---

**TADT Map** - Giải pháp quản lý thửa đất hiệu quả với công nghệ hiện đại. 