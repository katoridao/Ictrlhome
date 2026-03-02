const express = require("express");
const router = express.Router();
const House = require("../models/House");
const User = require("../models/User");
const DeviceUsage = require("../models/DeviceUsage");
const ElectricitySetting = require("../models/ElectricitySetting");

/**
 * Tạo nhà theo user (Logic cũ/Khởi tạo - Singleton)
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
 * [MỚI] Thêm nhà mới (Cho phép một User có nhiều nhà)
 * Route này khớp với api.post('/houses') ở Frontend
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, owner_id } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên nhà" });
    }

    // Tìm user để đảm bảo ID chính xác
    let user;
    if (phone) {
      user = await User.findOne({ phone });
    } else if (owner_id) {
      user = await User.findById(owner_id);
    }

    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Tạo nhà mới (Không kiểm tra existingHouse)
    const house = await House.create({
      name: name,
      owner_id: user._id,
    });

    res.status(201).json({
      message: "Thêm nhà thành công",
      house,
    });
  } catch (err) {
    console.error("❌ ADD HOUSE ERROR:", err);
    res.status(500).json({
      message: "Lỗi server",
      error: err.message,
    });
  }
});

/**
 * Lấy danh sách nhà theo số điện thoại
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

/**
 * [MỚI] Lấy thống kê điện năng và tính tiền điện theo bậc thang
 * GET /api/houses/:id/statistics?month=10&year=2023
 */
router.get("/:id/statistics", async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;

    const now = new Date();
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1;
    const currentYear = year ? parseInt(year) : now.getFullYear();

    // Xác định khoảng thời gian đầu tháng đến cuối tháng
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // 1. Tính tổng số điện tiêu thụ của cả nhà trong tháng
    const usages = await DeviceUsage.find({
      house_id: id,
      start_time: { $gte: startDate, $lte: endDate }
    });

    const totalKwh = usages.reduce((acc, curr) => acc + (curr.energy_kwh || 0), 0);

    // 2. Lấy cấu hình giá điện (Nếu chưa có sẽ tạo mặc định theo EVN)
    let setting = await ElectricitySetting.findOne({ house_id: id });
    if (!setting) {
      setting = await ElectricitySetting.create({ house_id: id, price_per_kwh: 3000 });
    }

    // 3. Tính tiền theo đơn giá (Flat rate)
    const price = setting.price_per_kwh || 0;
    const totalCost = totalKwh * price;
    
    const billDetails = [
      { tier_name: "Đơn giá", kwh: totalKwh, price: price, cost: totalCost }
    ];

    res.json({
      house_id: id, month: currentMonth, year: currentYear,
      total_kwh: parseFloat(totalKwh.toFixed(2)),
      total_cost: Math.round(totalCost),
      details: billDetails
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tính toán hóa đơn", error: err.message });
  }
});

module.exports = router;
