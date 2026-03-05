const express = require("express");
const router = express.Router();
const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");
const { authenticate, checkHouseMembership } = require("../middlewares/auth");

const HOUSE_ID = "H001";

// START DEVICE
router.post("/start/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });
    if (device.house_id !== HOUSE_ID) return res.status(403).json({ message: "Does not belong to this house" });
    if (device.status) return res.status(400).json({ message: "Device already ON" });

    const existed = await DeviceUsage.findOne({ device_id: device._id, end_time: { $exists: false } });
    if (existed) return res.status(400).json({ message: "Device already has active session" });

    device.status = true;
    await device.save();

    const usage = await DeviceUsage.create({ device_id: device._id, start_time: new Date() });
    res.json({ message: "Device turned ON", usage });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// STOP DEVICE
router.post("/stop/:deviceId", async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findById(deviceId);
    if (!device) return res.status(404).json({ message: "Device not found" });
    if (device.house_id !== HOUSE_ID) return res.status(403).json({ message: "Does not belong to this house" });
    if (!device.status) return res.status(400).json({ message: "Device already OFF" });

    const usage = await DeviceUsage.findOne({ device_id: device._id, end_time: { $exists: false } }).sort({ start_time: -1 });
    if (!usage) return res.status(400).json({ message: "Active session not found" });

    const endTime = new Date();
    const durationMinutes = Math.max(1, Math.round((endTime - usage.start_time) / 60000));
    const energyKwh = Number(((device.power_watt * durationMinutes) / 60000).toFixed(4));

    usage.end_time = endTime;
    usage.duration_minutes = durationMinutes;
    usage.energy_kwh = energyKwh;
    await usage.save();

    device.status = false;
    await device.save();

    res.json({ message: "Device turned OFF", usage });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// LIST USAGES — trả rỗng nếu chưa là member
router.get("/", authenticate, checkHouseMembership, async (req, res) => {
  try {
    if (!req.isHouseMember) {
      return res.json({ usages: [] });
    }

    const devices = await Device.find({ house_id: HOUSE_ID }).select("_id");
    const deviceIds = devices.map((d) => d._id);

    const usages = await DeviceUsage.find({ device_id: { $in: deviceIds } })
      .sort({ start_time: -1 })
      .populate("device_id", "name type power_watt");

    res.json({ usages });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DAILY SUMMARY — trả rỗng nếu chưa là member
router.get("/summary/day", authenticate, checkHouseMembership, async (req, res) => {
  try {
    if (!req.isHouseMember) {
      return res.json({ total_energy_kwh: 0, total_sessions: 0 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const devices = await Device.find({ house_id: HOUSE_ID }).select("_id");
    const deviceIds = devices.map((d) => d._id);

    const result = await DeviceUsage.aggregate([
      { $match: { device_id: { $in: deviceIds }, end_time: { $gte: startOfDay } } },
      { $group: { _id: null, totalEnergy: { $sum: "$energy_kwh" }, totalSessions: { $sum: 1 } } },
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