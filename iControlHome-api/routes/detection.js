const express = require("express");
const router = express.Router();
const Detection = require("../models/Detection");
const { notifyCameraDetection } = require("../services/notificationService");

router.post("/save-token", async (req, res) => {
  return res.json({
    message:
      "Endpoint này đã được thay thế bằng /api/notification-token để lưu FCM token theo từng user.",
  });
});

router.post("/detect", async (req, res) => {
  try {
    const { name, image, house_id = "H001", time } = req.body;

    const normalizedName = String(name || "Unknown").trim() || "Unknown";
    const status = normalizedName === "Unknown" ? "unknown" : "known";

    const detection = await Detection.create({
      house_id,
      name: normalizedName,
      image,
      status,
      time: time ? new Date(time) : new Date(),
    });

    await notifyCameraDetection({
      houseId: house_id,
      personName: normalizedName,
      isKnown: status === "known",
    });

    if (global.io) {
      global.io.to(String(house_id)).emit("camera_detection", {
        detection,
      });
    }

    res.json(detection);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { period, status, house_id = "H001" } = req.query;
    const query = { house_id };

    if (status === "known") query.status = "known";
    if (status === "unknown") query.status = "unknown";

    let data = await Detection.find(query).sort({ time: -1 });

    if (period === "day") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      data = data.filter((d) => new Date(d.time) >= start);
    } else if (period === "week") {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      data = data.filter((d) => new Date(d.time) >= start);
    } else if (period === "month") {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      data = data.filter((d) => new Date(d.time) >= start);
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
