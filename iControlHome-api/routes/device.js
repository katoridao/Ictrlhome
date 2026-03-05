const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const DeviceUsage = require("../models/DeviceUsage");
const Room = require("../models/Room");
const { authenticate, isOwner, canControlDevice, checkHouseMembership } = require("../middlewares/auth");

// Helper: kiểm tra can_control cho MEMBER
// Ưu tiên: quyền phòng > quyền thiết bị đơn lẻ (nhất quán với auth.js)
const resolveCanControl = async (userId, device) => {
  // Ưu tiên 1: quyền theo PHÒNG (nếu thiết bị đã gắn phòng)
  if (device.room_id) {
    // room_id có thể đã populate (object) hoặc chưa (ObjectId)
    const roomId = device.room_id._id || device.room_id;
    const room = await Room.findById(roomId);
    if (room) {
      const roomPerm = room.permissions.find(
        p => p.user_id.toString() === userId.toString()
      );
      if (roomPerm?.can_control) return true;
    }
  }

  // Ưu tiên 2: quyền theo THIẾT BỊ đơn lẻ
  const devicePerm = device.permissions.find(
    p => p.user_id.toString() === userId.toString()
  );
  return !!(devicePerm?.can_control);
};

// 1. Lấy danh sách thiết bị
// OWNER : thấy + điều khiển tất cả
// MEMBER: thấy tất cả (blur nếu chưa có quyền), can_control = true/false
router.get("/", authenticate, checkHouseMembership, async (req, res) => {
  try {
    if (!req.isHouseMember) {
      return res.json({ devices: [] });
    }

    const userId = req.user._id;
    const role = req.user.role;
    const { room_id } = req.query;

    let query = { house_id: "H001" };
    if (room_id) {
      query.room_id = room_id === "null" ? null : room_id;
    }

    // populate "name" và "permissions" của phòng để resolveCanControl dùng luôn
    const allDevices = await Device.find(query).populate("room_id", "name permissions");

    // OWNER thấy tất cả, luôn có quyền điều khiển
    if (role === "OWNER") {
      return res.json({
        devices: allDevices.map(d => ({ ...d.toObject(), can_control: true })),
      });
    }

    // MEMBER: trả về TẤT CẢ thiết bị
    // can_control = true nếu có quyền qua phòng HOẶC quyền thiết bị đơn lẻ
    const devicesWithPermission = await Promise.all(
      allDevices.map(async device => {
        const can_control = await resolveCanControl(userId, device);
        return { ...device.toObject(), can_control };
      })
    );

    res.json({ devices: devicesWithPermission });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Tạo thiết bị mới (Chỉ OWNER)
router.post("/", authenticate, isOwner, async (req, res) => {
  try {
    const { name, type, esp32_id, room_id, power_watt } = req.body;

    if (!name || !type || !esp32_id || power_watt == null) {
      return res.status(400).json({ message: "Thiếu dữ liệu (name, type, esp32_id, power_watt)" });
    }

    const device = await Device.create({
      name: name.trim(),
      type,
      esp32_id,
      house_id: "H001",
      room_id: room_id || null,
      power_watt,
      status: false,
    });

    res.status(201).json({ device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. Cập nhật thông tin thiết bị (Chỉ OWNER)
router.put("/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { name, type, esp32_id, room_id, power_watt } = req.body;

    const updatedDevice = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { name: name?.trim(), type, esp32_id, room_id, power_watt },
      { new: true }
    );

    if (!updatedDevice) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    res.json({ device: updatedDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Bật/Tắt thiết bị (OWNER hoặc MEMBER có quyền phòng/thiết bị)
router.put("/:id/status", authenticate, canControlDevice, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user._id;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { status: !!status },
      { new: true }
    );

    if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const now = new Date();

    if (status) {
      const existed = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: { $exists: false },
      });
      if (!existed) {
        await DeviceUsage.create({ device_id: device._id, start_time: now });
      }
    } else {
      const lastUsage = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: { $exists: false },
      }).sort({ start_time: -1 });

      if (lastUsage) {
        const durationMs = now - lastUsage.start_time;
        const durationMinutes = durationMs / (1000 * 60);
        const energyKwh = (device.power_watt * durationMinutes) / (1000 * 60);
        lastUsage.end_time = now;
        lastUsage.duration_minutes = Math.round(durationMinutes * 100) / 100;
        lastUsage.energy_kwh = energyKwh;
        await lastUsage.save();
      }
    }

    await DeviceLog.create({
      device_id: device._id,
      user_id: userId,
      action: status ? "ON" : "OFF",
    });

    res.json({ device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. Gán phòng (Chỉ OWNER)
router.put("/assign-room/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { room_id } = req.body;
    const updatedDevice = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { room_id },
      { new: true }
    );
    if (!updatedDevice) return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    res.json({ device: updatedDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 6. Xóa thiết bị (Chỉ OWNER)
router.delete("/:id", authenticate, isOwner, async (req, res) => {
  try {
    const deletedDevice = await Device.findOneAndDelete({
      _id: req.params.id,
      house_id: "H001",
    });
    if (!deletedDevice) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    res.json({ message: "Xóa thiết bị thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server khi xóa" });
  }
});

// 7. Thống kê điện năng
router.get("/:id/statistics", authenticate, canControlDevice, async (req, res) => {
  try {
    const { month, year } = req.query;
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const usages = await DeviceUsage.find({
      device_id: device._id,
      start_time: { $gte: startDate, $lte: endDate },
    });

    const totalMinutes = usages.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    const totalKwh = usages.reduce((acc, curr) => acc + (curr.energy_kwh || 0), 0);

    res.json({
      month: m, year: y,
      total_minutes: Number(totalMinutes.toFixed(2)),
      total_kwh: Number(totalKwh.toFixed(4)),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 8. Gán quyền thiết bị đơn lẻ cho Member (Chỉ OWNER)
router.post("/:id/assign-permission", authenticate, isOwner, async (req, res) => {
  try {
    const { member_id, can_control } = req.body;
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: "Thiết bị không tồn tại" });

    const existingIndex = device.permissions.findIndex(
      (p) => p.user_id.toString() === member_id
    );

    if (existingIndex > -1) {
      device.permissions[existingIndex].can_control = can_control;
    } else {
      device.permissions.push({ user_id: member_id, can_control });
    }

    await device.save();
    res.json({ message: "Cấp quyền thiết bị thành công", device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cấp quyền" });
  }
});

module.exports = router;