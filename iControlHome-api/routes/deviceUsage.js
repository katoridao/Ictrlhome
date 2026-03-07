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

    const usage = await DeviceUsage.findOne({
      device_id: deviceId,
      end_time: null
    }).sort({ start_time: -1 });

    if (!usage) {
      return res.status(400).json({ message: "No active session" });
    }

    const device = await Device.findById(deviceId);

    const end = new Date();

    const durationSeconds =
      (end.getTime() - usage.start_time.getTime()) / 1000;

    usage.end_time = end;

    usage.duration_minutes = durationSeconds / 60;

    usage.energy_kwh =
      (device.power_watt * durationSeconds) / 3600000;

    await usage.save();

    device.status = false;
    await device.save();

    res.json({
      message: "Device turned OFF",
      usage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// LIST USAGES
router.get("/", async (req, res) => {
  try {

    const devices = await Device.find({ house_id: HOUSE_ID });

    const deviceIds = devices.map(d => d._id);

    const usages = await DeviceUsage.find({
      device_id: { $in: deviceIds }
    }).populate("device_id", "name type power_watt status");

    const now = Date.now();

    const result = usages.map(u => {

      let duration = u.duration_minutes || 0;

      if (!u.end_time) {
        const realtime =
          (now - new Date(u.start_time).getTime()) / 60000;

        duration += realtime;
      }

      const energy =
        (u.device_id.power_watt * duration) / 60000;

      return {
        ...u._doc,
        realtime_minutes: duration,
        realtime_energy_kwh: energy
      };

    });

    res.json({ usages: result });

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

router.get("/realtime", async (req, res) => {
  try {

    const devices = await Device.find({ house_id: HOUSE_ID });

    const usages = await DeviceUsage.find({
      device_id: { $in: devices.map(d => d._id) }
    });

    const now = Date.now();

    const result = devices.map(device => {

      const sessions = usages.filter(
        u => u.device_id.toString() === device._id.toString()
      );

      let totalSeconds = 0;

      sessions.forEach(s => {

        if (s.end_time) {
          totalSeconds +=
            (new Date(s.end_time) - new Date(s.start_time)) / 1000;
        } else {
          totalSeconds +=
            (now - new Date(s.start_time)) / 1000;
        }

      });

      const energy_kwh = (device.power_watt * totalSeconds) / 3600000;
      const cost = energy_kwh * 1806;

      return {
        device_id: device._id,
        device_name: device.name,
        runtime_seconds: totalSeconds,
        energy_kwh,
        cost,
        power_watt: device.power_watt,
        isActive: device.status
      };

    });

    res.json({ devices: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

function calculateElectricCost(kwh) {

  const tiers = [
    { limit: 50, price: 1806 },
    { limit: 50, price: 1866 },
    { limit: 100, price: 2167 },
    { limit: 100, price: 2729 },
    { limit: 100, price: 3050 },
    { limit: Infinity, price: 3151 }
  ];

  let remaining = kwh;
  let cost = 0;

  for (const tier of tiers) {

    const used = Math.min(remaining, tier.limit);

    cost += used * tier.price;

    remaining -= used;

    if (remaining <= 0) break;

  }

  return cost;
}
module.exports = router;