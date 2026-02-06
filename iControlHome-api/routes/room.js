const express = require("express");
const router = express.Router();

const Room = require("../models/Room");
const House = require("../models/House");

/**
 * THÊM 3 PHÒNG MẶC ĐỊNH
 */
router.post("/init", async (req, res) => {
  try {
    const { houseId } = req.body;

    if (!houseId) {
      return res.status(400).json({ message: "Thiếu houseId" });
    }

    const house = await House.findById(houseId);
    if (!house) {
      return res.status(404).json({ message: "House không tồn tại" });
    }

    
    const existedRooms = await Room.find({ house_id: houseId });
    if (existedRooms.length > 0) {
      return res.status(200).json({
        message: "House đã có phòng",
        rooms: existedRooms,
      });
    }

    const defaultRooms = ["Phòng khách", "Phòng bếp", "Phòng ngủ"];

    const rooms = await Room.insertMany(
      defaultRooms.map((name) => ({
        name,
        house_id: houseId, 
      }))
    );

    res.status(201).json({
      message: "Tạo phòng mặc định thành công",
      rooms,
    });
  } catch (error) {
    console.error("ROOM INIT ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * THÊM PHÒNG MỚI
 */
router.post("/", async (req, res) => {
  try {
    const { houseId, name } = req.body;

    if (!houseId || !name) {
      return res.status(400).json({
        message: "Thiếu houseId hoặc tên phòng",
      });
    }

    const room = await Room.create({
      name: name.trim(),
      house_id: houseId, 
    });

    res.status(201).json({
      message: "Thêm phòng thành công",
      room,
    });
  } catch (error) {
    console.error("ROOM CREATE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * SỬA PHÒNG
 */
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên phòng không được trống" });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    res.json({
      message: "Cập nhật phòng thành công",
      room,
    });
  } catch (error) {
    console.error("ROOM UPDATE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * XOÁ PHÒNG
 */
router.delete("/:id", async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    res.json({
      message: "Xoá phòng thành công",
    });
  } catch (error) {
    console.error("ROOM DELETE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * LẤY CHI TIẾT PHÒNG
 */
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    res.status(200).json({
      message: "Lấy chi tiết phòng thành công",
      room,
    });
  } catch (error) {
    console.error("ROOM GET ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

module.exports = router;
