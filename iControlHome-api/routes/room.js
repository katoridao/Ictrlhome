const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const House = require("../models/House");
const {
  authenticate,
  isOwner,
  checkHouseMembership,
} = require("../middlewares/auth");

// 1. Lấy danh sách phòng
router.get("/", authenticate, checkHouseMembership, async (req, res) => {
  try {
    // Chưa được thêm vào nhà → trả về mảng rỗng
    if (!req.isHouseMember) {
      return res.json({ rooms: [] });
    }

    const house = await House.findById("H001");
    if (!house)
      return res.status(404).json({ message: "House chưa được khởi tạo" });

    const rooms = await Room.find({ house_id: "H001" });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Tạo phòng mới (Chỉ OWNER)
router.post("/add", authenticate, isOwner, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Thiếu tên phòng" });

    const room = await Room.create({ name: name.trim(), house_id: "H001" });

    // ✅ Emit realtime: chỉ gửi đến các client trong cùng nhà
    const io = req.app.get("io");
    if (io) {
      console.log("[Room POST] Emit room_added to H001:", room._id);
      io.to("H001").emit("room_added", {
        room,
        house_id: "H001",
      });
    }

    res.status(201).json({ message: "Thêm phòng thành công", room });
  } catch (error) {
    console.error("[Room POST] Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. Cập nhật tên phòng (Chỉ OWNER)
router.put("/edit/:id", authenticate, isOwner, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Tên phòng không được để trống" });

    const updatedRoom = await Room.findOneAndUpdate(
      { _id: req.params.id, house_id: "H001" },
      { name: name.trim() },
      { new: true },
    );

    if (!updatedRoom)
      return res.status(404).json({ message: "Không tìm thấy phòng" });

    // ✅ Emit realtime: chỉ gửi đến các client trong cùng nhà
    const io = req.app.get("io");
    if (io) {
      console.log("[Room PUT] Emit room_updated to H001:", updatedRoom._id);
      io.to("H001").emit("room_updated", {
        room: updatedRoom,
        house_id: "H001",
      });
    }

    res.json({ message: "Cập nhật thành công", room: updatedRoom });
  } catch (error) {
    console.error("[Room PUT] Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Xóa phòng (Chỉ OWNER)
router.delete("/del/:id", authenticate, isOwner, async (req, res) => {
  try {
    const deletedRoom = await Room.findOneAndDelete({
      _id: req.params.id,
      house_id: "H001",
    });
    if (!deletedRoom)
      return res.status(404).json({ message: "Không tìm thấy phòng để xóa" });

    // ✅ Emit realtime: chỉ gửi đến các client trong cùng nhà
    const io = req.app.get("io");
    if (io) {
      console.log("[Room DELETE] Emit room_deleted to H001:", deletedRoom._id);
      io.to("H001").emit("room_deleted", {
        room_id: deletedRoom._id.toString(),
        house_id: "H001",
      });
    }

    res.json({ message: "Xóa thành công" });
  } catch (error) {
    console.error("[Room DELETE] Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. Cấp quyền phòng cho Member (Chỉ OWNER)
router.post(
  "/assign-permission/:id",
  authenticate,
  isOwner,
  async (req, res) => {
    try {
      const { member_id, can_view, can_control } = req.body;
      if (!member_id)
        return res.status(400).json({ message: "Thiếu member_id" });

      const room = await Room.findById(req.params.id);
      if (!room)
        return res.status(404).json({ message: "Không tìm thấy phòng" });

      const existingIndex = room.permissions.findIndex(
        (p) => p.user_id.toString() === member_id,
      );

      if (existingIndex > -1) {
        room.permissions[existingIndex].can_view =
          can_view ?? room.permissions[existingIndex].can_view;
        room.permissions[existingIndex].can_control =
          can_control ?? room.permissions[existingIndex].can_control;
      } else {
        room.permissions.push({
          user_id: member_id,
          can_view: can_view ?? true,
          can_control: can_control ?? false,
        });
      }

      await room.save();

      // ✅ Emit realtime: chỉ gửi đến các client trong cùng nhà
      const io = req.app.get("io");
      if (io) {
        console.log(
          `[Room Permission] Emit permission_updated to ${room.house_id}`,
        );
        io.to(room.house_id.toString()).emit("permission_updated", {
          room_id: room._id.toString(),
          user_id: member_id,
          can_view: can_view ?? true,
          can_control: can_control ?? false,
          house_id: room.house_id,
        });
      }

      res.json({ message: "Cấp quyền phòng thành công", room });
    } catch (error) {
      console.error("[Room Permission] Error:", error);
      res.status(500).json({ message: "Lỗi khi cấp quyền phòng" });
    }
  },
);

// 6. Xóa quyền phòng của Member (Chỉ OWNER)
router.delete(
  "/remove-permission/:id",
  authenticate,
  isOwner,
  async (req, res) => {
    try {
      const { member_id } = req.body;
      if (!member_id)
        return res.status(400).json({ message: "Thiếu member_id" });

      const room = await Room.findById(req.params.id);
      if (!room)
        return res.status(404).json({ message: "Không tìm thấy phòng" });

      room.permissions = room.permissions.filter(
        (p) => p.user_id.toString() !== member_id,
      );

      await room.save();

      // ✅ Emit realtime: chỉ gửi đến các client trong cùng nhà
      const io = req.app.get("io");
      if (io) {
        console.log(
          `[Room Permission] Emit permission_removed to ${room.house_id}`,
        );
        io.to(room.house_id.toString()).emit("permission_removed", {
          room_id: room._id.toString(),
          user_id: member_id,
          house_id: room.house_id,
        });
      }

      res.json({ message: "Đã xóa quyền phòng", room });
    } catch (error) {
      console.error("[Room Permission] Error:", error);
      res.status(500).json({ message: "Lỗi khi xóa quyền phòng" });
    }
  },
);

module.exports = router;
