// src/constants.js
// Định nghĩa các giá trị dùng chung cho toàn hệ thống

export const LAND_USE_PURPOSES = [
  { value: 'LNQ', label: 'Đất lâm nghiệp' },
  { value: 'LUC', label: 'Đất trồng lúa' },
  { value: 'ONT', label: 'Đất ở nông thôn' },
  // Thêm các mục đích khác nếu cần
];

export const PARCEL_STATUSES = [
  { value: 'normal', label: 'Bình thường' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'locked', label: 'Đã khóa' },
  // Thêm các trạng thái khác nếu cần
];

export const LEGAL_STATUSES = [
  { value: 'chua_co', label: 'Chưa có' },
  { value: 'dang_xin', label: 'Đang xin' },
  { value: 'da_xong', label: 'Đã xong' },
  // Thêm các trạng thái khác nếu cần
];

export const TRANSACTION_STATUSES = [
  { value: 'da_mua', label: 'Đã mua' },
  { value: 'dang_giao_dich', label: 'Đang giao dịch' },
  { value: 'chua_giao_dich', label: 'Chưa giao dịch' },
];

export const TRANSFER_DOC_STATUSES = [
  { value: 'da_ky', label: 'Đã ký' },
  { value: 'chua_ky', label: 'Chưa ký' },
];

export const NAME_TRANSFER_STATUSES = [
  { value: 'da_sang_ten', label: 'Đã sang tên' },
  { value: 'chua_sang_ten', label: 'Chưa sang tên' },
];
