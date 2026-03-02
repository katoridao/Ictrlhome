const express = require("express");
const router = express.Router();
const DeviceLog = require("../models/DeviceLog");
const Device = require("../models/Device");

// Lấy danh sách nhật ký thiết bị
router.get("/", async (req, res) => {
  try {
    const { house_id, period } = req.query;
    let filter = {};

    if (house_id) {
      // Tìm tất cả thiết bị trong nhà này trước
      const devices = await Device.find({ house_id: house_id }).select("_id");
      const deviceIds = devices.map((d) => d._id);
      filter.device_id = { $in: deviceIds };
    }

    if (period === "day") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startOfDay };
    }

    const logs = await DeviceLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user_id", "name");

    const result = logs.map((log) => {
      const doc = log.toObject();
      if (doc.user_id && doc.user_id.name) {
        doc.user_name = doc.user_id.name;
      }
      return doc;
    });

    res.json({ device_log: result });
  } catch (error) {
    console.error("Lỗi lấy nhật ký:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;