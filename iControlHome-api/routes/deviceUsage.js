const express = require("express");
const router = express.Router();
const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");

const HOUSE_ID = "H001";

// start
router.post("/start/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    if (device.house_id !== HOUSE_ID) {
      return res.status(403).json({ message: "Không thuộc house này" });
    }

    if (device.status) {
      return res.status(400).json({ message: "Thiết bị đang bật rồi" });
    }

    const existingUsage = await DeviceUsage.findOne({
      device_id: device._id,
      end_time: null,
    });

    if (existingUsage) {
      return res
        .status(400)
        .json({ message: "Thiết bị đang có phiên hoạt động" });
    }

    device.status = true;
    await device.save();

    const usage = await DeviceUsage.create({
      device_id: device._id,
      start_time: new Date(),
    });

    res.json({ message: "Đã bật thiết bị", usage });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// stop
router.post("/stop/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    if (device.house_id !== HOUSE_ID) {
      return res.status(403).json({ message: "Không thuộc house này" });
    }

    if (!device.status) {
      return res.status(400).json({ message: "Thiết bị đang tắt rồi" });
    }

    const usage = await DeviceUsage.findOne({
      device_id: device._id,
      end_time: null,
    });

    if (!usage) {
      return res
        .status(400)
        .json({ message: "Không tìm thấy phiên hoạt động" });
    }

    const endTime = new Date();

    let durationMinutes = Math.round((endTime - usage.start_time) / 60000);

    if (durationMinutes <= 0) durationMinutes = 1;

    const energyKwh = Number(
      ((device.power_watt * durationMinutes) / 60000).toFixed(4),
    );

    usage.end_time = endTime;
    usage.duration_minutes = durationMinutes;
    usage.energy_kwh = energyKwh;

    await usage.save();

    device.status = false;
    await device.save();

    res.json({ message: "Đã tắt thiết bị", usage });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// get list
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
    res.status(500).json({ message: "Lỗi server" });
  }
});

// sum today
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
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
