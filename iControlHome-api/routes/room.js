const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const { authenticate, isOwner, checkHouseMembership } = require("../middlewares/auth");

// 1. Lấy danh sách phòng
router.get("/", authenticate, checkHouseMembership, async (req, res) => {
  try {
    if (!req.isHouseMember) {
      return res.json({ rooms: [] });
    }

    const rooms = await Room.find({ house_id: "H001" });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Tạo phòng mới (Chỉ OWNER)
router.post("/", authenticate, isOwner, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Thiếu tên phòng" });

    const room = await Room.create({ name: name.trim(), house_id: "H001" });
    res.status(201).json({ message: "Thêm phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. Cập nhật tên phòng (Chỉ OWNER)
router.put("/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tên phòng không được để trống" });

    const updatedRoom = await Room.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { name: name.trim() },
      { new: true }
    );

    if (!updatedRoom) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json({ message: "Cập nhật thành công", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Xóa phòng (Chỉ OWNER)
router.delete("/:id", authenticate, isOwner, async (req, res) => {
  try {
    const deletedRoom = await Room.findOneAndDelete({ _id: req.params.id, house_id: "H001" });
    if (!deletedRoom) return res.status(404).json({ message: "Không tìm thấy phòng để xóa" });
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. Cấp quyền phòng cho Member (Chỉ OWNER)
router.post("/assign-permission/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { member_id, can_view, can_control } = req.body;
    if (!member_id) return res.status(400).json({ message: "Thiếu member_id" });

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    const existingIndex = room.permissions.findIndex(
      (p) => p.user_id.toString() === member_id
    );

    if (existingIndex > -1) {
      // Cập nhật quyền nếu đã tồn tại
      room.permissions[existingIndex].can_view = can_view ?? room.permissions[existingIndex].can_view;
      room.permissions[existingIndex].can_control = can_control ?? room.permissions[existingIndex].can_control;
    } else {
      // Thêm mới
      room.permissions.push({
        user_id: member_id,
        can_view: can_view ?? true,
        can_control: can_control ?? false,
      });
    }

    await room.save();
    res.json({ message: "Cấp quyền phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cấp quyền phòng" });
  }
});

// 6. Xóa quyền phòng của Member (Chỉ OWNER)
router.delete("/remove-permission/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { member_id } = req.body;
    if (!member_id) return res.status(400).json({ message: "Thiếu member_id" });

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

    room.permissions = room.permissions.filter(
      (p) => p.user_id.toString() !== member_id
    );

    await room.save();
    res.json({ message: "Đã xóa quyền phòng", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa quyền phòng" });
  }
});

module.exports = router;