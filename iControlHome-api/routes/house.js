const express = require("express");
const router = express.Router();
const House = require("../models/House");
const User = require("../models/User");
const Device = require("../models/Device");
const Room = require("../models/Room");
const DeviceUsage = require("../models/DeviceUsage");
const { authenticate, isOwner, isMember } = require("../middlewares/auth");

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

// GET /api/houses/check-member — Kiểm tra user hiện tại có trong nhà không
router.get("/check-member", authenticate, async (req, res) => {
  try {
    const user = req.user;

    if (user.role === "OWNER") {
      return res.json({ is_member: true, role: "OWNER" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    const isMemberOfHouse = house.members.some(
      (m) => m.toString() === user._id.toString(),
    );

    res.json({
      is_member: isMemberOfHouse,
      role: user.role,
    });
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

// POST /api/houses/add-member — Thêm thành viên bằng số điện thoại (Chỉ OWNER)
router.post("/add-member", authenticate, isOwner, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Vui lòng nhập số điện thoại" });
    }

    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy người dùng với số điện thoại này" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    if (house.owner_id.toString() === user._id.toString()) {
      return res.status(400).json({ message: "Người dùng này là chủ nhà" });
    }

    const alreadyMember = house.members.some(
      (m) => m.toString() === user._id.toString(),
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ message: "Người dùng đã là thành viên của nhà" });
    }

    house.members.push(user._id);
    await house.save();

    if (user.role !== "OWNER") {
      user.role = "MEMBER";
      await user.save();
    }

    const updatedHouse = await House.findById("H001")
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    const io = req.app.get("io");
    if (io) {
      console.log("[House] Emit member_added to H001:", user._id);
      io.to("H001").emit("member_added", {
        member: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
        },
        house_id: "H001",
      });
    }

    res.json({
      message: `Đã thêm ${user.name || user.phone} vào nhà thành công`,
      house: updatedHouse,
    });
  } catch (err) {
    console.error("[House] Error adding member:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// POST /api/houses/request-join — Member tự tham gia bằng SĐT + mật khẩu của OWNER
router.post("/request-join", authenticate, async (req, res) => {
  try {
    const { admin_phone, admin_password } = req.body;
    const requestingUser = req.user;

    if (!admin_phone || !admin_password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const admin = await User.findOne({
      phone: admin_phone.trim(),
      role: "OWNER",
    });
    if (!admin) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy chủ nhà với số điện thoại này" });
    }

    const isMatch = await bcrypt.compare(admin_password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu không chính xác" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    if (house.owner_id.toString() === requestingUser._id.toString()) {
      return res
        .status(400)
        .json({ message: "Bạn là chủ nhà, không cần tham gia" });
    }

    const alreadyMember = house.members.some(
      (m) => m.toString() === requestingUser._id.toString(),
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ message: "Bạn đã là thành viên của nhà này" });
    }

    house.members.push(requestingUser._id);
    await house.save();

    const io = req.app.get("io");
    if (io) {
      console.log(
        "[House] Emit member_added to H001 (request-join):",
        requestingUser._id,
      );
      io.to("H001").emit("member_added", {
        member: {
          _id: requestingUser._id,
          name: requestingUser.name,
          phone: requestingUser.phone,
        },
        house_id: "H001",
      });
    }

    res.json({ message: "Tham gia nhà thành công! Bạn đã được thêm vào nhà." });
  } catch (err) {
    console.error("[House] Error request-join:", err);
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
      return res
        .status(404)
        .json({ message: "Thành viên không tồn tại trong nhà" });
    }

    house.members = house.members.filter((m) => m.toString() !== member_id);
    await house.save();

    // ✅ Xóa toàn bộ device permissions của member này
    await Device.updateMany(
      { "permissions.user_id": member_id },
      { $pull: { permissions: { user_id: member_id } } }
    );

    // ✅ Xóa toàn bộ room permissions của member này
    await Room.updateMany(
      { "permissions.user_id": member_id },
      { $pull: { permissions: { user_id: member_id } } }
    );

    const io = req.app.get("io");
    if (io) {
      console.log("[House] Emit member_removed to H001:", member_id);
      io.to("H001").emit("member_removed", {
        member_id,
        house_id: "H001",
      });
    }

    const updatedHouse = await House.findById("H001")
      .populate("owner_id", "name phone")
      .populate("members", "name phone");

    res.json({
      message: "Đã xóa thành viên khỏi nhà",
      house: updatedHouse,
    });
  } catch (err) {
    console.error("[House] Error removing member:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// GET /api/houses/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const houseId = !id || id === "null" || id === "undefined" ? "H001" : id;

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

// POST /api/houses/join — Member tự tham gia nhà bằng SĐT admin + mật khẩu nhà
router.post("/join", authenticate, async (req, res) => {
  try {
    const { admin_phone, join_password } = req.body;
    const memberId = req.user._id;

    if (!admin_phone || !join_password) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const admin = await User.findOne({ phone: admin_phone.trim() });
    if (!admin || admin.role !== "OWNER") {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản chủ nhà" });
    }

    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy nhà" });
    }

    if (house.join_password !== join_password) {
      return res
        .status(401)
        .json({ message: "Mật khẩu tham gia nhà không đúng" });
    }

    if (house.owner_id.toString() === memberId.toString()) {
      return res
        .status(400)
        .json({ message: "Bạn là chủ nhà, không cần tham gia" });
    }

    const alreadyMember = house.members.some(
      (m) => m.toString() === memberId.toString(),
    );
    if (alreadyMember) {
      return res
        .status(400)
        .json({ message: "Bạn đã là thành viên của nhà này" });
    }

    house.members.push(memberId);
    await house.save();

    res.json({ message: "Tham gia nhà thành công! Bạn đã được kết nối." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;