const express = require("express");
const router = express.Router();

const Device = require("../models/Device");
const Room = require("../models/Room");

/**
 * THÊM THIẾT BỊ
 */
router.post("/", async (req, res) => {
  try {
    const { roomId, name, type, esp32Id } = req.body;

    if (!roomId || !name || !type || !esp32Id) {
      return res.status(400).json({
        message: "Thiếu roomId, name, type hoặc esp32Id",
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        message: "Room không tồn tại",
      });
    }

    const device = await Device.create({
      name: name.trim(),
      type,
      esp32Id,
      room_id: roomId, 
      status: 0,
    });

    res.status(201).json({
      message: "Thêm thiết bị thành công",
      device,
    });
  } catch (error) {
    console.error("DEVICE CREATE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * LẤY DANH SÁCH THIẾT BỊ THEO ROOM
 */
router.get("/", async (req, res) => {
  try {
    const { roomId } = req.query;

    if (!roomId) {
      return res.status(400).json({
        message: "Thiếu roomId",
      });
    }

    const devices = await Device.find({ room_id: roomId }); 

    res.json({
      message: "Lấy danh sách thiết bị thành công",
      devices,
    });
  } catch (error) {
    console.error("DEVICE LIST ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * BẬT / TẮT THIẾT BỊ
 */
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json({
        message: "Status chỉ được là 0 (tắt) hoặc 1 (bật)",
      });
    }

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        message: "Thiết bị không tồn tại",
      });
    }

    res.json({
      message: status === 1 ? "Thiết bị đang chạy" : "Thiết bị đã tắt",
      device,
    });
  } catch (error) {
    console.error("DEVICE STATUS ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * SỬA THIẾT BỊ
 */
router.put("/:id", async (req, res) => {
  try {
    const { name, type, esp32Id } = req.body;

    const device = await Device.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        esp32Id,
      },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({
        message: "Thiết bị không tồn tại",
      });
    }

    res.json({
      message: "Cập nhật thiết bị thành công",
      device,
    });
  } catch (error) {
    console.error("DEVICE UPDATE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * XOÁ THIẾT BỊ
 */
router.delete("/:id", async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Thiết bị không tồn tại",
      });
    }

    res.json({
      message: "Xoá thiết bị thành công",
    });
  } catch (error) {
    console.error("DEVICE DELETE ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

/**
 * LẤY CHI TIẾT THIẾT BỊ
 */
router.get("/:id", async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);

    if (!device) {
      return res.status(404).json({
        message: "Thiết bị không tồn tại",
      });
    }

    res.json({
      message: "Lấy chi tiết thiết bị thành công",
      device,
    });
  } catch (error) {
    console.error("DEVICE GET ERROR:", error);
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
});

module.exports = router;
