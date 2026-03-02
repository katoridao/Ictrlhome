const express = require("express");
const router = express.Router();
const ElectricitySetting = require("../models/ElectricitySetting");

// GET /api/electricity-settings?house_id=...
// Lấy cấu hình giá điện cho một nhà. Nếu chưa có, tạo mới với giá mặc định.
router.get("/", async (req, res) => {
  try {
    const { house_id } = req.query;
    if (!house_id) {
      return res.status(400).json({ message: "Vui lòng cung cấp house_id" });
    }

    let setting = await ElectricitySetting.findOne({ house_id: house_id });

    // Nếu không tìm thấy, tạo một cấu hình mặc định và trả về
    if (!setting) {
      setting = await ElectricitySetting.create({
        house_id: house_id,
        price_per_kwh: 3000, // Giá mặc định
      });
    }

    res.json(setting);
  } catch (error) {
    console.error("Lỗi lấy cấu hình giá điện:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// PUT /api/electricity-settings
// Cập nhật giá điện cho một nhà
router.put("/", async (req, res) => {
  try {
    const { house_id, price_per_kwh } = req.body;

    if (!house_id || price_per_kwh === undefined) {
      return res.status(400).json({ message: "Vui lòng cung cấp house_id và price_per_kwh" });
    }
    
    const price = parseFloat(price_per_kwh);
    if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Giá điện không hợp lệ" });
    }

    // Tìm và cập nhật, hoặc tạo mới nếu chưa có (upsert: true)
    const updatedSetting = await ElectricitySetting.findOneAndUpdate(
      { house_id: house_id },
      { $set: { price_per_kwh: price, effective_from: new Date() } },
      { new: true, upsert: true } // new: trả về document mới, upsert: tạo nếu chưa có
    );

    res.json({ message: "Cập nhật giá điện thành công", setting: updatedSetting });
  } catch (error) {
    console.error("Lỗi cập nhật giá điện:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// POST /api/electricity-settings
// Hỗ trợ thêm phương thức POST để tạo/cập nhật giá điện (tương tự PUT)
router.post("/", async (req, res) => {
  try {
    const { house_id, price_per_kwh } = req.body;

    if (!house_id || price_per_kwh === undefined) {
      return res.status(400).json({ message: "Vui lòng cung cấp house_id và price_per_kwh" });
    }
    
    const price = parseFloat(price_per_kwh);
    if (isNaN(price) || price < 0) {
        return res.status(400).json({ message: "Giá điện không hợp lệ" });
    }

    // Upsert: Tạo mới nếu chưa có, cập nhật nếu đã có
    const updatedSetting = await ElectricitySetting.findOneAndUpdate(
      { house_id: house_id },
      { $set: { price_per_kwh: price, effective_from: new Date() } },
      { new: true, upsert: true }
    );

    res.json({ message: "Cài đặt giá điện thành công", setting: updatedSetting });
  } catch (error) {
    console.error("Lỗi cài đặt giá điện:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;