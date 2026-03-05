const express = require("express");
const router = express.Router();
const House = require("../models/House");
const User = require("../models/User");
const DeviceUsage = require("../models/DeviceUsage");
const { authenticate, isOwner } = require("../middlewares/auth");

// GET /api/houses
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

// GET /api/houses/statistics — phải đặt TRƯỚC /:id
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

    const totalKwh = usages.reduce((acc, curr) => acc + (curr.energy_kwh || 0), 0);
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

// POST /api/houses/add-member — Thêm thành viên bằng số điện thoại (Chỉ OWNER)
router.post("/add-member", authenticate, isOwner, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại" });
    }

    // Tìm user theo số điện thoại
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng với số điện thoại này" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    // Kiểm tra có phải owner không
    if (house.owner_id.toString() === user._id.toString()) {
      return res.status(400).json({ message: "Người dùng này là chủ nhà" });
    }

    // Kiểm tra đã là member chưa
    const alreadyMember = house.members.some(
      (m) => m.toString() === user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "Người dùng đã là thành viên của nhà" });
    }

    // Thêm vào mảng members
    house.members.push(user._id);
    await house.save();

    // Cập nhật role của user thành MEMBER nếu chưa có
    if (user.role !== "OWNER") {
      user.role = "MEMBER";
      await user.save();
    }

    const updatedHouse = await House.findById("H001")
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    res.json({
      message: `Đã thêm ${user.name || user.phone} vào nhà thành công`,
      house: updatedHouse,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// DELETE /api/houses/remove-member — Xóa thành viên (Chỉ OWNER)
router.delete("/remove-member", authenticate, isOwner, async (req, res) => {
  try {
    const { member_id } = req.body;

    if (!member_id) {
      return res.status(400).json({ message: "Thiếu member_id" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    const existed = house.members.some((m) => m.toString() === member_id);
    if (!existed) {
      return res.status(404).json({ message: "Thành viên không tồn tại trong nhà" });
    }

    house.members = house.members.filter((m) => m.toString() !== member_id);
    await house.save();

    const updatedHouse = await House.findById("H001")
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    res.json({
      message: "Đã xóa thành viên khỏi nhà",
      house: updatedHouse,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/houses/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const houseId = (!id || id === "null" || id === "undefined") ? "H001" : id;

    const house = await House.findById(houseId)
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    res.json(house);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;