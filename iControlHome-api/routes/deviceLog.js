const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");

router.get("/", async (req, res) => {
  try {
    const { period } = req.query;
    let filter = {};

    // Lọc theo house
    const devices = await Device.find({ house_id: "H001" }).select("_id");
    const deviceIds = devices.map((d) => d._id);
    filter.device_id = { $in: deviceIds };

    if (period === "day") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.created_at = { $gte: start };
    }

    const logs = await DeviceLog.find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .populate("user_id", "name")
      .populate("device_id", "name type");

    const result = logs.map((log) => ({
      _id: log._id,
      action: log.action,
      created_at: log.created_at,
      device: log.device_id
        ? {
            id: log.device_id._id,
            name: log.device_id.name,
            type: log.device_id.type,
          }
        : null,
      user: log.user_id
        ? {
            id: log.user_id._id,
            name: log.user_id.name,
          }
        : null,
    }));

    res.json({ logs: result });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
