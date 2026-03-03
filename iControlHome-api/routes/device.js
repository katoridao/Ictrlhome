const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const DeviceUsage = require("../models/DeviceUsage");

// Lấy danh sách thiết bị
router.get("/", async (req, res) => {
  try {
    const { room_id } = req.query;

    const query = { house_id: "H001" };

    if (room_id) {
      query.room_id = room_id === "null" ? null : room_id;
    }

    const devices = await Device.find(query);
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Tạo thiết bị mới
router.post("/", async (req, res) => {
  try {
    const { name, type, esp32_id, room_id, power_watt } = req.body;

    if (!name || !type || !esp32_id || power_watt == null) {
      return res.status(400).json({
        message: "Thiếu dữ liệu (name, type, esp32_id, power_watt)",
      });
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

// Cập nhật thông tin thiết bị
router.put("/:id", async (req, res) => {
  try {
    const { name, type, esp32_id, room_id, power_watt } = req.body;

    const updatedDevice = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      {
        name: name?.trim(),
        type,
        esp32_id,
        room_id,
        power_watt,
      },
      { new: true },
    );

    if (!updatedDevice) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    res.json({ device: updatedDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Bật / Tắt thiết bị + tính điện
router.put("/:id/status", async (req, res) => {
  try {
    const { status, user_id } = req.body;

    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { status: !!status },
      { new: true },
    );

    if (!device)
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const now = new Date();

    if (status) {
      // Kiểm tra xem đã có usage đang mở chưa
      const existed = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: { $exists: false },
      });

      if (!existed) {
        await DeviceUsage.create({
          device_id: device._id,
          house_id: device.house_id,
          start_time: now,
        });
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

    // Ghi log
    await DeviceLog.create({
      device_id: device._id,
      user_id: user_id || null,
      action: status ? "ON" : "OFF",
    });

    res.json({ device });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Gán phòng
router.put("/assign-room/:id", async (req, res) => {
  try {
    const { room_id } = req.body;

    const updatedDevice = await Device.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { room_id },
      { new: true },
    );

    if (!updatedDevice)
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    res.json({ device: updatedDevice });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Xóa thiết bị
router.delete("/:id", async (req, res) => {
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

// Tiền điện theo tháng
router.get("/:id/statistics", async (req, res) => {
  try {
    const { month, year } = req.query;

    const device = await Device.findOne({
      _id: req.params.id,
      house_id: "H001",
    });

    if (!device)
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const now = new Date();
    const m = month ? parseInt(month) : now.getMonth() + 1;
    const y = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const usages = await DeviceUsage.find({
      device_id: device._id,
      start_time: { $gte: startDate, $lte: endDate },
    });

    const totalMinutes = usages.reduce(
      (acc, curr) => acc + (curr.duration_minutes || 0),
      0,
    );

    const totalKwh = usages.reduce(
      (acc, curr) => acc + (curr.energy_kwh || 0),
      0,
    );

    res.json({
      month: m,
      year: y,
      total_minutes: Number(totalMinutes.toFixed(2)),
      total_kwh: Number(totalKwh.toFixed(4)),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// Tiền điện trong khoảng ngày
router.get("/:id/statistics-range", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to)
      return res.status(400).json({ message: "Thiếu from hoặc to" });

    const device = await Device.findOne({
      _id: req.params.id,
      house_id: "H001",
    });

    if (!device)
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });

    const startDate = new Date(from);
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);

    const usages = await DeviceUsage.find({
      device_id: device._id,
      start_time: { $gte: startDate, $lte: endDate },
    });

    const totalMinutes = usages.reduce(
      (acc, curr) => acc + (curr.duration_minutes || 0),
      0,
    );

    const totalKwh = usages.reduce(
      (acc, curr) => acc + (curr.energy_kwh || 0),
      0,
    );

    res.json({
      from,
      to,
      total_minutes: Number(totalMinutes.toFixed(2)),
      total_kwh: Number(totalKwh.toFixed(4)),
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
