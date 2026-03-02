const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const DeviceUsage = require("../models/DeviceUsage");
const House = require("../models/House");

// 1. Lấy danh sách thiết bị
router.get("/", async (req, res) => {
  try {
    const { room_id, house_id } = req.query; 
    let query = {};

    // Lọc theo house_id nếu có
    if (house_id) {
      query.house_id = house_id;
    }

    // Xử lý logic lọc theo room_id
    if (room_id === 'null') {
      query.room_id = null; // Lấy thiết bị chưa gán phòng
    } else if (room_id) {
      query.room_id = room_id; // Lấy thiết bị của phòng cụ thể
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
    const { name, type, esp32Id, room_id, house_id, user_id, power_watt } = req.body;
    
    let finalHouseId = house_id;

    // Nếu không có house_id nhưng có user_id, tự động tìm nhà của user đó
    if (!finalHouseId && user_id) {
      const house = await House.findOne({ owner_id: user_id });
      if (house) {
        finalHouseId = house._id;
      }
    }

    if (!name || !type || !esp32Id || !finalHouseId) {
      return res.status(400).json({ message: "Thiếu dữ liệu (name, type, esp32Id, house_id hoặc user_id)" });
    }
    
    const device = await Device.create({
      name: name.trim(),
      type,
      esp32Id,
      house_id: finalHouseId,
      room_id: room_id || null, // Nếu không chọn phòng thì là null
      status: 0,
      power_watt: power_watt || 0, // Công suất mặc định là 0 nếu không nhập
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
    const { name, type, esp32Id, room_id, power_watt } = req.body;
    
    const updatedDevice = await Device.findByIdAndUpdate(
      req.params.id,
      { 
        name: name ? name.trim() : undefined,
        type,
        esp32Id,
        power_watt,
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
    
    // --- LOGIC TÍNH TIỀN ĐIỆN (DeviceUsage) ---
    const now = new Date();
    if (status === 1) {
      // Nếu BẬT: Tạo bản ghi usage mới
      await DeviceUsage.create({
        device_id: device._id,
        house_id: device.house_id, // Lưu house_id để tính tổng điện năng theo nhà
        start_time: now,
      });
    } else {
      // Nếu TẮT: Tìm bản ghi usage đang mở (chưa có end_time) gần nhất
      const lastUsage = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: { $exists: false }, // Hoặc null
      }).sort({ start_time: -1 });

      if (lastUsage) {
        const endTime = now;
        const durationMs = endTime - lastUsage.start_time;
        const durationMinutes = durationMs / (1000 * 60);
        
        // Công thức: energy_kwh = (power_watt * duration_minutes) / (1000 * 60)
        const energyKwh = (device.power_watt * durationMinutes) / (1000 * 60);

        lastUsage.end_time = endTime;
        lastUsage.duration_minutes = Math.round(durationMinutes * 100) / 100;
        lastUsage.energy_kwh = energyKwh;
        await lastUsage.save();
      }
    }

    // Ghi lại nhật ký thiết bị (DeviceLog)
    try {
      await DeviceLog.create({
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
