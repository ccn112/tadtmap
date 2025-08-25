# File Mẫu - TADT Map

## Tổng quan

Dự án TADT Map cung cấp các file mẫu để bạn có thể test chức năng import và làm quen với hệ thống.

## File Mẫu Có Sẵn

### 1. `sample_parcels.geojson` - Dự án Hà Nội
- **Vị trí**: Khu vực Hà Nội (105.85, 21.02)
- **Số lượng**: 8 thửa đất
- **Loại hình**: Biệt thự, căn hộ, shophouse, khu vui chơi, TTTM
- **Mục đích**: Test cơ bản, làm quen với hệ thống

### 2. `sample_parcels_longbien.geojson` - Dự án Long Biên
- **Vị trí**: Quận Long Biên, ven sông Hồng (105.85, 21.02)
- **Số lượng**: 11 thửa đất
- **Loại hình**: Biệt thự ven sông, căn hộ cao cấp, shophouse thương mại
- **Đặc điểm**: 
  - 10 thửa đất cạnh nhau (5x2 grid)
  - 1 thửa đất lớn cho khu vui chơi
  - Tất cả đều ven sông Hồng
  - Diện tích mỗi thửa: 450m² (trừ khu vui chơi: 900m²)

### 3. `sample_parcels_longbien.dxf` - File AutoCAD
- **Định dạng**: DXF (AutoCAD)
- **Nội dung**: Tương ứng với file GeoJSON Long Biên
- **Lưu ý**: Chức năng import DXF đang được phát triển

## Cách Sử Dụng

### Import File GeoJSON
1. Mở ứng dụng TADT Map
2. Click "Import DXF/GeoJSON"
3. Chọn file `.geojson` mẫu
4. Nhập tiêu đề dự án (VD: "Dự án Long Biên")
5. Click "Import"

### Kết Quả Mong Đợi
- Các thửa đất sẽ được tạo tự động
- Thông tin từ file mẫu được giữ nguyên
- Màu sắc và trạng thái được áp dụng
- Hiển thị trên bản đồ với tọa độ chính xác

## Thông Tin Chi Tiết

### Dự án Long Biên - Ven Sông Hồng

#### Vị trí địa lý
- **Tọa độ**: 105.85°E - 105.88°E, 21.02°N - 21.03°N
- **Khu vực**: Quận Long Biên, Hà Nội
- **Đặc điểm**: Ven sông Hồng, view sông đẹp

#### Bố cục thửa đất
```
    A1  A2  A3  A4  A5
    B1  B2  B3  B4  B5
              C1
```

#### Chi tiết từng lô

**Hàng A (Ven sông chính)**
- A1: Biệt thự ven sông (450m²) - Đã xong
- A2: Biệt thự liền kề (450m²) - Đang xin
- A3: Shophouse thương mại (450m²) - Chưa có
- A4: Căn hộ cao cấp (450m²) - Đã xong
- A5: Căn hộ studio (450m²) - Đang xin

**Hàng B (Hàng thứ hai)**
- B1: Biệt thự hướng sông (450m²) - Đã xong
- B2: Căn hộ duplex (450m²) - Đang xin
- B3: Shophouse liền kề (450m²) - Chưa có
- B4: Căn hộ penthouse (450m²) - Đã xong
- B5: Căn hộ garden (450m²) - Đang xin

**Lô đặc biệt**
- C1: Khu vui chơi giải trí (900m²) - Đã xong

## Màu Sắc và Trạng Thái

### Màu sắc
- 🟢 **Xanh lá** (#51cf66): Thửa đất đã hoàn thành
- 🟡 **Vàng** (#ffd43b): Thửa đất đang xin cấp phép
- 🔴 **Đỏ** (#ff6b6b): Thửa đất chưa có giấy tờ

### Trạng thái pháp lý
- **Đã xong**: Hoàn thành thủ tục pháp lý
- **Đang xin**: Đang trong quá trình xin cấp phép
- **Chưa có**: Chưa có giấy tờ pháp lý

### Trạng thái GPMB
- **Đã xong**: Hoàn thành giải phóng mặt bằng
- **Đang GP**: Đang trong quá trình giải phóng
- **Chưa GP**: Chưa bắt đầu giải phóng

## Lưu Ý Kỹ Thuật

### Tọa độ
- Sử dụng hệ tọa độ WGS84 (EPSG:4326)
- Định dạng: [Longitude, Latitude]
- Độ chính xác: 4 chữ số thập phân

### Diện tích
- Đơn vị: m²
- Tính toán tự động từ tọa độ polygon
- Có thể chỉnh sửa thủ công

### File đính kèm
- Hỗ trợ nhiều định dạng: PDF, JPG, PNG, DOC, XLS
- Lưu trong thư mục `uploads/`
- Có thể tải xuống hoặc xem trực tiếp

## Hỗ Trợ

Nếu gặp vấn đề khi import file mẫu:
1. Kiểm tra định dạng file (.geojson, .json)
2. Kiểm tra cấu trúc GeoJSON
3. Xem console browser để biết lỗi chi tiết
4. Liên hệ team phát triển

---

**TADT Map** - Giải pháp quản lý thửa đất hiệu quả với công nghệ hiện đại. 