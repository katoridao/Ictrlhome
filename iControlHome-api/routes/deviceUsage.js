const express = require("express");
const router = express.Router();

const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");


router.post("/device-on/:deviceId", async (req, res) => {
  try {

    const deviceId = req.params.deviceId;

    const device = await Device.findById(deviceId);

    if (!device) {
      return res.status(404).json({
        message: "Device not found",
      });
    }

    const running = await DeviceUsage.findOne({
      device_id: deviceId,
      end_time: null,
    });

    if (running) {
      return res.json({
        message: "Device already running",
      });
    }

    // Đồng bộ trạng thái thiết bị: bật mới coi là đang chạy
    if (!device.status) {
      device.status = true;
      await device.save();
    }

    const usage = new DeviceUsage({
      device_id: deviceId,
      start_time: new Date(),
    });

    await usage.save();

    // 🔥 emit socket update ngay
    global.io.emit("device-update");

    res.json({
      message: "Device turned ON",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});


router.post("/device-off/:deviceId", async (req, res) => {

  try {

    const deviceId = req.params.deviceId;

    const usage = await DeviceUsage.findOne({
      device_id: deviceId,
      end_time: null,
    }).populate("device_id");

    if (!usage) {
      return res.status(404).json({
        message: "Device not running",
      });
    }

    const now = new Date();

    const runtime =
      Math.floor((now - usage.start_time) / 1000);

    const energy =
      (usage.device_id.power_watt * runtime) / 3600000;

    usage.end_time = now;
    usage.duration_minutes = runtime / 60;
    usage.energy_kwh = energy;

    await usage.save();

    // Đồng bộ trạng thái thiết bị: tắt thì không còn "đang chạy"
    const device = usage.device_id;
    if (device && device.status) {
      device.status = false;
      await device.save();
    }

    // 🔥 emit socket update ngay
    global.io.emit("device-update");

    res.json({
      message: "Device turned OFF",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }

});

// ===============================
// REALTIME THỐNG KÊ
// ===============================
router.get("/realtime", async (req, res) => {
  try {

    const devices = await Device.find();

    const result = [];

    for (const device of devices) {
      const deviceIsOn = !!device.status;

      // Tổng tất cả các lần đã chạy (usage đã đóng)
      const closedUsages = await DeviceUsage.find({
        device_id: device._id,
        end_time: { $ne: null },
      });

      let totalSeconds = 0;
      let totalEnergy = 0;

      closedUsages.forEach((u) => {
        const durationMinutes =
          typeof u.duration_minutes === "number" && u.duration_minutes > 0
            ? u.duration_minutes
            : (new Date(u.end_time) - new Date(u.start_time)) / (1000 * 60);
        totalSeconds += Math.floor(durationMinutes * 60);
        totalEnergy += u.energy_kwh || 0;
      });

      // Lần đang chạy (nếu có)
      const openUsage = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: null,
      }).sort({ start_time: -1 });

      let isActive = false;

      if (openUsage && deviceIsOn) {
        const runtimeNow = Math.floor(
          (Date.now() - new Date(openUsage.start_time)) / 1000
        );
        totalSeconds += runtimeNow;
        totalEnergy += (device.power_watt * runtimeNow) / 3600000;
        isActive = true;
      }

      const runtime = totalSeconds;
      const energy = totalEnergy;

      result.push({
        device_id: device._id,
        device_name: device.name,
        power_watt: device.power_watt,
        runtime_seconds: runtime,
        energy_kwh: energy,
        isActive,
      });
    }

    res.json({ devices: result });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});


module.exports = router;