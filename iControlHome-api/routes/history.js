const express = require("express");
const router = express.Router();
const History = require("../models/History");

// Lấy danh sách lịch sử
router.get("/", async (req, res) => {
  try {
    const history = await History.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("user_id", "name");

    const result = history.map((h) => {
      const doc = h.toObject();
      if (doc.user_id && doc.user_id.name) {
        doc.user_name = doc.user_id.name;
      }
      return doc;
    });

    res.json({ history: result });
  } catch (error) {
    console.error("Lỗi lấy lịch sử:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
