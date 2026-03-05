const express = require("express");
const router = express.Router();
const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");

const HOUSE_ID = "H001";


// START DEVICE
router.post("/start/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    if (device.house_id !== HOUSE_ID) {
      return res.status(403).json({ message: "Does not belong to this house" });
    }

    if (device.status) {
      return res.status(400).json({ message: "Device already ON" });
    }

    const existed = await DeviceUsage.findOne({
      device_id: device._id,
      end_time: null,
    });

    if (existed) {
      return res.status(400).json({
        message: "Device already has active session",
      });
    }

    device.status = true;
    await device.save();

    const usage = await DeviceUsage.create({
      device_id: device._id,
      start_time: new Date(),
    });

    res.json({
      message: "Device turned ON",
      usage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// STOP DEVICE
router.post("/stop/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    console.log("Đang dừng thiết bị ID:", deviceId);

    const usage = await DeviceUsage.findOne({
      device_id: deviceId, // Thử dùng trực tiếp deviceId từ params
      end_time: null
    }).sort({ start_time: -1 });

    if (!usage) {
      console.log("Không tìm thấy session nào đang mở cho thiết bị này!");
      return res.status(400).json({ message: "No active session" });
    }

    console.log("Đã tìm thấy session:", usage._id);

    usage.end_time = new Date();
    usage.duration_minutes = 10; // Giả sử để test
    usage.energy_kwh = 0.5;      // Giả sử để test

    const savedUsage = await usage.save();
    console.log("Kết quả sau khi lưu vào DB:", savedUsage);

    res.json({ message: "Success", usage: savedUsage });
  } catch (err) {
    console.error("LỖI RỒI:", err);
    res.status(500).json({ message: err.message });
  }
});


// LIST USAGES
router.get("/", async (req, res) => {
  try {
    const devices = await Device.find({ house_id: HOUSE_ID }).select("_id");

    const deviceIds = devices.map((d) => d._id);

    const usages = await DeviceUsage.find({
      device_id: { $in: deviceIds },
    })
      .sort({ start_time: -1 })
      .populate("device_id", "name type power_watt");

    res.json({ usages });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// DAILY SUMMARY
router.get("/summary/day", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const devices = await Device.find({ house_id: HOUSE_ID }).select("_id");

    const deviceIds = devices.map((d) => d._id);

    const result = await DeviceUsage.aggregate([
      {
        $match: {
          device_id: { $in: deviceIds },
          end_time: { $gte: startOfDay },
        },
      },
      {
        $group: {
          _id: null,
          totalEnergy: { $sum: "$energy_kwh" },
          totalSessions: { $sum: 1 },
        },
      },
    ]);

    res.json({
      total_energy_kwh: result[0]?.totalEnergy || 0,
      total_sessions: result[0]?.totalSessions || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;