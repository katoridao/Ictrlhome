const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const { authenticate, checkHouseMembership } = require("../middlewares/auth");

router.get("/", authenticate, checkHouseMembership, async (req, res) => {
  try {
    const { period, house_id, device_type } = req.query;

    if (!house_id) {
      return res.status(400).json({ message: "Thiếu house_id" });
    }

    let filter = {};

    // lấy danh sách device theo house
    let deviceFilter = { house_id };

    // lọc theo loại thiết bị nếu có
    if (device_type && device_type !== "Tất cả") {
      deviceFilter.type = device_type;
    }

    const devices = await Device.find(deviceFilter).select("_id");
    const deviceIds = devices.map((d) => d._id);

    filter.device_id = { $in: deviceIds };

    // lọc thời gian
    if (period === "day") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      filter.created_at = { $gte: start };
    }

    if (period === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      filter.created_at = { $gte: start };
    }

    if (period === "month") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      filter.created_at = { $gte: start };
    }

    const logs = await DeviceLog.find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .populate("user_id", "name")
      .populate({
        path: "device_id",
        select: "name type room_id",
        populate: {
          path: "room_id",
          model: "Room",
          select: "name",
        },
      });

    const result = logs.map((log) => ({
      _id: log._id,
      action: log.action,
      created_at: log.created_at,

      device: log.device_id
        ? {
            id: log.device_id._id,
            name: log.device_id.name,
            type: log.device_id.type,
            room: log.device_id.room_id
              ? {
                  id: log.device_id.room_id._id,
                  name: log.device_id.room_id.name,
                }
              : null,
          }
        : null,

      user: log.user_id
        ? { id: log.user_id._id, name: log.user_id.name }
        : null,
    }));

    res.json({ logs: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
