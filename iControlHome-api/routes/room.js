const express = require("express");
const router = express.Router();
const Room = require("../models/Room");
const House = require("../models/House");

// 1. Lấy danh sách phòng (Có hỗ trợ lọc theo house_id)
// Path: GET /api/rooms hoặc /api/rooms?house_id=...
router.get("/", async (req, res) => {
  try {
    const { house_id } = req.query; // Lấy house_id từ query string
    
    let filter = {};
    if (house_id) {
      filter = { house_id: house_id };
    }

    const rooms = await Room.find(filter);
    console.log(`Đã tìm thấy ${rooms.length} phòng cho house_id: ${house_id || 'Tất cả'}`);
    res.json({ rooms });
  } catch (error) {
    console.error("Lỗi GET rooms:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. Khởi tạo phòng mặc định cho một nhà
// Path: POST /api/rooms/init
router.post("/init", async (req, res) => {
  try {
    const { house_id } = req.body; 
    if (!house_id) return res.status(400).json({ message: "Thiếu house_id" });

    const house = await House.findById(house_id);
    if (!house) return res.status(404).json({ message: "House không tồn tại" });

    const existedRooms = await Room.find({ house_id: house_id });
    if (existedRooms.length > 0) {
      return res.status(200).json({ message: "House đã có phòng", rooms: existedRooms });
    }

    const defaultRooms = ["Phòng khách", "Phòng bếp", "Phòng ngủ"];
    const rooms = await Room.insertMany(
      defaultRooms.map((name) => ({ name, house_id: house_id }))
    );
    res.status(201).json({ message: "Tạo phòng mặc định thành công", rooms });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// 3. Tạo một phòng mới thủ công
// Path: POST /api/rooms
router.post("/", async (req, res) => {
  try {
    const { house_id, name } = req.body; 
    if (!house_id || !name) return res.status(400).json({ message: "Thiếu thông tin" });

    const room = await Room.create({ name: name.trim(), house_id: house_id });
    res.status(201).json({ message: "Thêm phòng thành công", room });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 4. Cập nhật tên phòng (Bổ sung để khớp với RoomScreen.js)
// Path: PUT /api/rooms/:id
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Tên phòng không được để trống" });

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedRoom) return res.status(404).json({ message: "Không tìm thấy phòng" });
    res.json({ message: "Cập nhật thành công", room: updatedRoom });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 5. Xóa phòng
// Path: DELETE /api/rooms/:id
router.delete("/:id", async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) return res.status(404).json({ message: "Không tìm thấy phòng để xóa" });
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;