const express = require("express");
const router = express.Router();
const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");

const HOUSE_ID = "H001";


// ================= START DEVICE =================
router.post("/start/:deviceId", async (req, res) => {
  try {

    const { deviceId } = req.params;

    const device = await Device.findById(deviceId);

    if (!device)
      return res.status(404).json({ message: "Device not found" });

    if (device.house_id !== HOUSE_ID)
      return res.status(403).json({ message: "Wrong house" });

    if (device.status)
      return res.status(400).json({ message: "Device already ON" });

    const existed = await DeviceUsage.findOne({
      device_id: deviceId,
      end_time: null
    });

    if (existed)
      return res.status(400).json({ message: "Session already running" });

    device.status = true;
    await device.save();

    const usage = await DeviceUsage.create({
      device_id: deviceId,
      start_time: new Date()
    });

    res.json({
      message: "Device turned ON",
      usage
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= STOP DEVICE =================
router.post("/stop/:deviceId", async (req, res) => {
  try {

    const { deviceId } = req.params;

    const usage = await DeviceUsage.findOne({
      device_id: deviceId,
      end_time: null
    }).sort({ start_time: -1 });

    if (!usage)
      return res.status(400).json({ message: "No active session" });

    const device = await Device.findById(deviceId);

    const end = new Date();

    const durationSeconds =
      (end.getTime() - usage.start_time.getTime()) / 1000;

    usage.end_time = end;

    usage.duration_minutes = Math.floor(durationSeconds / 60);

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


// ================= LIST USAGES =================
router.get("/", async (req, res) => {
  try {

    const devices = await Device.find({ house_id: HOUSE_ID });

    const deviceIds = devices.map(d => d._id);

    const usages = await DeviceUsage.find({
      device_id: { $in: deviceIds }
    }).populate("device_id", "name power_watt status");

    const now = Date.now();

    const result = usages.map(u => {

      let seconds = 0;

      if (u.end_time) {

        seconds =
          (new Date(u.end_time) - new Date(u.start_time)) / 1000;

      } else {

        seconds =
          (now - new Date(u.start_time)) / 1000;

      }

      const minutes = seconds / 60;

      const energy =
        (u.device_id.power_watt * seconds) / 3600000;

      return {
        ...u._doc,
        realtime_minutes: minutes,
        realtime_energy_kwh: energy
      };

    });

    res.json({ usages: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


router.get("/realtime", async (req, res) => {
  try {

    const devices = await Device.find({ house_id: HOUSE_ID });

    const now = Date.now();

    const result = await Promise.all(
      devices.map(async (device) => {

        let runtimeSeconds = 0;

        const activeSession = await DeviceUsage.findOne({
          device_id: device._id,
          end_time: null
        });

        if (activeSession && device.status === true) {

          runtimeSeconds =
            (now - new Date(activeSession.start_time)) / 1000;

        }

        runtimeSeconds = Math.floor(runtimeSeconds);

        const energy_kwh =
          (device.power_watt * runtimeSeconds) / 3600000;

        const cost = energy_kwh * 1806;

        return {
          device_id: device._id,
          device_name: device.name,
          runtime_seconds: runtimeSeconds,
          energy_kwh,
          cost,
          power_watt: device.power_watt,
          isActive: device.status
        };

      })
    );

    res.json({ devices: result });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ================= EVN ELECTRIC COST =================
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