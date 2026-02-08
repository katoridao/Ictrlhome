const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const History = require("../models/History");

// 1. Lấy danh sách thiết bị
router.get("/", async (req, res) => {
  try {
    const { room_id } = req.query; 
    let query = {};

    // Xử lý logic lọc theo room_id
    if (room_id === 'null') {
      query = { room_id: null }; // Lấy thiết bị chưa gán phòng
    } else if (room_id) {
      query = { room_id: room_id }; // Lấy thiết bị của phòng cụ thể
    }

    const devices = await Device.find(query);
    res.json({ devices }); // Trả về object { devices: [...] } để khớp với Frontend
  } catch (error) {
    console.error("Lỗi lấy danh sách thiết bị:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Tạo thiết bị mới
router.post("/", async (req, res) => {
  try {
    const { name, type, esp32Id, room_id } = req.body;
    
    if (!name || !type || !esp32Id) {
      return res.status(400).json({ message: "Thiếu dữ liệu (name, type, esp32Id)" });
    }
    
    const device = await Device.create({
      name: name.trim(),
      type,
      esp32Id,
      room_id: room_id || null, // Nếu không chọn phòng thì là null
      status: 0,
    });
    
    res.status(201).json({ device });
  } catch (error) {
    console.error("Lỗi tạo thiết bị:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. Cập nhật thông tin thiết bị (Tên, Loại, Phòng, ESP ID)
// QUAN TRỌNG: Route này cần thiết cho tính năng "Sửa thiết bị" ở AddDeviceModal
router.put("/:id", async (req, res) => {
  try {
    const { name, type, esp32Id, room_id } = req.body;
    
    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      { 
        name: name ? name.trim() : undefined,
        type,
        esp32Id,
        room_id // Cho phép cập nhật phòng ngay tại đây
      },
      { new: true } // Trả về dữ liệu mới sau khi update
    );

    if (!updatedDevice) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    res.json({ device: updatedDevice });
  } catch (error) {
    console.error("Lỗi cập nhật thiết bị:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Cập nhật trạng thái ON/OFF (Bật/Tắt)
router.put("/:id/status", async (req, res) => {
  try {
    const { status, user_id, user_name } = req.body;
    const device = await Device.findByIdAndUpdate(
      req.params.id, 
      { status: status }, 
      { new: true }
    );
    
    if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    
    // Ghi lại lịch sử hoạt động
    try {
      await History.create({
        device_id: device._id,
        device_name: device.name,
        device_type: device.type,
        action: status === 1 ? 'ON' : 'OFF',
        user_id: user_id || null, // Nếu frontend gửi lên thông tin user
        user_name: user_name || null
      });
    } catch (err) {
      console.error("Lỗi ghi lịch sử:", err);
    }

    res.json({ device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. Gán thiết bị vào phòng (Dùng cho UnassignedDevicesScreen)
router.put("/assign-room/:id", async (req, res) => {
  try {
    const { room_id } = req.body;
    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      { room_id: room_id },
      { new: true }
    );
    
    if (!updatedDevice) return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    
    res.json({ message: "Đã thêm thiết bị vào phòng", device: updatedDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 6. Xóa thiết bị
router.delete("/:id", async (req, res) => {
  try {
    const deletedDevice = await Device.findByIdAndDelete(req.params.id);
    if (!deletedDevice) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị để xóa" });
    }
    res.json({ message: "Xóa thiết bị thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa" });
  }
});

module.exports = router;
