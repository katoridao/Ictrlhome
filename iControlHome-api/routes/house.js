const express = require("express");
const router = express.Router();
const House = require("../models/House");
const User = require("../models/User");

/**
 * Tạo nhà theo user
 */
router.post("/init", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

   
    const existingHouse = await House.findOne({ owner_id: user._id });
    if (existingHouse) {
      return res.status(200).json({
        message: "User đã có house",
        house: existingHouse,
      });
    }

    
    const house = await House.create({
      name: `Nhà của ${user.name}`,
      owner_id: user._id,
    });

    res.status(201).json({
      message: "Tạo house thành công",
      house,
    });
  } catch (err) {
    console.error("❌ HOUSE ERROR:", err);
    res.status(500).json({
      message: "Lỗi server",
      error: err.message,
    });
  }
});

/**
 * Lấy nhà theo số điện thoại
 */
router.get("/", async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    
    const houses = await House.find({ owner_id: user._id });

    res.json({
      message: "Lấy house thành công",
      houses,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi server",
      error: err.message,
    });
  }
});

/**
 * Tìm nhà theo id
 */
router.get("/:id", async (req, res) => {
  try {
    const house = await House.findById(req.params.id);

    if (!house) {
      return res.status(404).json({ message: "House không tồn tại" });
    }

    res.json({
      message: "Lấy chi tiết house thành công",
      house,
    });
  } catch (err) {
    res.status(500).json({
      message: "Lỗi server",
      error: err.message,
    });
  }
});

module.exports = router;
