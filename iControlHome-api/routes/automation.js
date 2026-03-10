const express = require("express");
const router = express.Router();
const Automation = require("../models/Automation");
const { authenticate } = require("../middlewares/auth");

// 1. LẤY DANH SÁCH (Cần populate để App hiện tên thiết bị)
router.get("/", authenticate, async (req, res) => {
  try {
    const list = await Automation.find()
      .populate("device_id", "name status") 
      .populate("user_id", "name");
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. TẠO MỚI (PHẢI CÓ authenticate ĐỂ LẤY USER_ID)
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, device_id, action, trigger_time, repeat_type, house_id } = req.body;

    // KIỂM TRA: Nếu không có req.user từ middleware auth.js, dừng lại ngay
    if (!req.user || !req.user._id) {
        return res.status(401).json({ message: "Không xác định được người dùng. Hãy đăng nhập lại!" });
    }

    const newAuto = new Automation({
      name: name.trim(),
      device_id: device_id,
      user_id: req.user._id, // Lấy ID từ Token đã giải mã
      action: action,
      trigger_time: trigger_time,
      house_id: house_id || "H001",
      repeat_type: repeat_type || "DAILY",
      enabled: true
    });

    const savedData = await newAuto.save();
    console.log("✅ Lưu kịch bản thành công:", savedData.name);
    res.status(201).json(savedData);

  } catch (error) {
    console.error("❌ LỖI LƯU KỊCH BẢN:", error.message);
    res.status(400).json({ 
      message: "Dữ liệu không hợp lệ: " + error.message 
    });
  }
});

// 3. XOÁ KỊCH BẢN
router.delete("/:id", authenticate, async (req, res) => {
    try {
        await Automation.findByIdAndDelete(req.params.id);
        res.json({ message: "Đã xoá kịch bản" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;