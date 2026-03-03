const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const House = require("../models/House");

// 1. Lấy danh sách phòng
router.get("/", async (req, res) => {
  try {
    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "House chưa được khởi tạo" });
    }

    const rooms = await Room.find({ house_id: "H001" });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Tạo một phòng mới
router.post("/add", async (req, res) => {
  try {
    const house = await House.findById("H001");
    if (!house) {
      return res.status(404).json({ message: "House chưa được khởi tạo" });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Thiếu tên phòng" });
    }

    const room = await Room.create({
      name: name.trim(),
      house_id: "H001",
    });

    res.status(201).json({
      message: "Thêm phòng thành công",
      room,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. Cập nhật tên phòng (Bổ sung để khớp với RoomScreen.js)
router.put("/edit/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ message: "Tên phòng không được để trống" });

    const updatedRoom = await Room.findOneAndUpdate(
      { _id: req.params.id },
      { name: name.trim() },
      { new: true },
    );

    if (!updatedRoom)
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json({ message: "Cập nhật thành công", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Xóa phòng
router.delete("/del/:id", async (req, res) => {
  try {
    const deletedRoom = await Room.findOneAndDelete({
      _id: req.params.id,
      house_id: "H001",
    });
    if (!deletedRoom)
      return res.status(404).json({ message: "Không tìm thấy phòng để xóa" });
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
