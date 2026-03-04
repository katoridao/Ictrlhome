const express = require("express");
const router = express.Router();
const House = require("../models/House");
const DeviceUsage = require("../models/DeviceUsage");

router.get("/", async (req, res) => {
  try {
    const house = await House.findById("H001")
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    if (!house) {
      return res.status(404).json({ message: "House chưa được khởi tạo" });
    }

    res.json(house);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/statistics", async (req, res) => {
  try {
    const { month, year } = req.query;

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "House không tồn tại" });
    }

    const now = new Date();
    const currentMonth = month ? parseInt(month) : now.getMonth() + 1;
    const currentYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const usages = await DeviceUsage.find({
      start_time: { $gte: startDate, $lte: endDate },
    });

    const totalKwh = usages.reduce(
      (acc, curr) => acc + (curr.energy_kwh || 0),
      0,
    );

    const price = house.electricity.price_per_kwh || 0;

    const totalCost = totalKwh * price;

    res.json({
      month: currentMonth,
      year: currentYear,
      total_kwh: Number(totalKwh.toFixed(2)),
      total_cost: Math.round(totalCost),
      price_per_kwh: price,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi tính toán hóa đơn" });
  }
});

module.exports = router;
