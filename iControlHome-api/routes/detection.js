const express = require("express");
const router = express.Router();
const Detection = require("../models/Detection");
const admin = require("firebase-admin");

let userToken = "";

/**
 *  SAVE TOKEN
 */
router.post("/save-token", async (req, res) => {
  try {
    userToken = req.body.token;
    res.json({ message: "Token saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 *  DETECT FACE (từ Python)
 */
router.post("/detect", async (req, res) => {
  try {
    const { name, image } = req.body;

    const status = name === "Unknown" ? "unknown" : "known";

    // lưu DB
    const detection = await Detection.create({
      name,
      image,
      status,
    });

    // gửi notification
    if (userToken) {
      await admin.messaging().send({
        notification: {
          title: "Camera AI",
          body:
            status === "known"
              ? `${name} vừa vào nhà`
              : "Phát hiện người lạ!",
        },
        token: userToken,
      });
    }

    res.json(detection);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET HISTORY (co loc theo period va status)
 */
router.get("/history", async (req, res) => {
  try {
    const { period, status } = req.query;
    const query = {};

    if (status === 'known') query.status = 'known';
    if (status === 'unknown') query.status = 'unknown';

    let data = await Detection.find(query).sort({ time: -1 });

    // Filter by period
    if (period === 'day') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      data = data.filter(d => new Date(d.time) >= start);
    } else if (period === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      data = data.filter(d => new Date(d.time) >= start);
    } else if (period === 'month') {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      data = data.filter(d => new Date(d.time) >= start);
    }

    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;