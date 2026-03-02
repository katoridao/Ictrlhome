const mongoose = require('mongoose');

const deviceUsageSchema = new mongoose.Schema({
  // Liên kết
  device_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Người tắt thiết bị (hoặc người bật)
  house_id: { type: mongoose.Schema.Types.ObjectId, ref: 'House' }, // Quan trọng: Để lọc lịch sử theo nhà
  
  // Lưu cứng thông tin để hiển thị nhanh (Denormalization)
  device_name: String, 
  device_type: String,
  user_name: String,  
  
  // Thông tin phiên hoạt động
  start_time: { type: Date, required: true }, // Thời điểm Bật
  end_time: { type: Date, default: Date.now }, // Thời điểm Tắt
  
  // Số liệu tính toán
  duration_minutes: { type: Number, default: 0 }, // (end_time - start_time) quy ra phút
  energy_kwh: { type: Number, default: 0 },       // Công thức: (W * phút) / 60000
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeviceUsage', deviceUsageSchema);
