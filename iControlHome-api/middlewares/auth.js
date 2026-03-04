const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Device = require("../models/Device");
const Room = require("../models/Room");

// 1. Xác thực Token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Không có quyền truy cập, vui lòng đăng nhập" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "smart_home_secret_key");

    const user = await User.findById(decoded._id || decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// 2. Chỉ OWNER
const isOwner = (req, res, next) => {
  if (req.user && req.user.role === "OWNER") return next();
  return res.status(403).json({ message: "Chỉ chủ nhà (OWNER) mới có quyền thực hiện hành động này" });
};

// 3. Kiểm tra quyền điều khiển thiết bị
// Ưu tiên: OWNER > quyền phòng > quyền thiết bị đơn lẻ
const canControlDevice = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const deviceId = req.params.id;

    // OWNER luôn có toàn quyền
    if (role === "OWNER") return next();

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    // Kiểm tra quyền theo PHÒNG (nếu thiết bị được gán phòng)
    if (device.room_id) {
      const room = await Room.findById(device.room_id);
      if (room) {
        const roomPerm = room.permissions.find(
          (p) => p.user_id.toString() === userId.toString()
        );
        if (roomPerm?.can_control) return next();
      }
    }

    // Kiểm tra quyền theo THIẾT BỊ đơn lẻ
    const devicePerm = device.permissions.find(
      (p) => p.user_id.toString() === userId.toString()
    );
    if (devicePerm?.can_control) return next();

    return res.status(403).json({ message: "Bạn không có quyền điều khiển thiết bị này" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra quyền" });
  }
};

// 4. Kiểm tra quyền XEM thiết bị
// Dùng để filter danh sách thiết bị MEMBER được thấy
const canViewDevice = async (userId, device) => {
  // Kiểm tra quyền theo phòng
  if (device.room_id) {
    const room = await Room.findById(device.room_id);
    if (room) {
      const roomPerm = room.permissions.find(
        (p) => p.user_id.toString() === userId.toString()
      );
      if (roomPerm?.can_view || roomPerm?.can_control) return true;
    }
  }

  // Kiểm tra quyền theo thiết bị đơn lẻ
  const devicePerm = device.permissions.find(
    (p) => p.user_id.toString() === userId.toString()
  );
  return !!(devicePerm?.can_control);
};

module.exports = { authenticate, isOwner, canControlDevice, canViewDevice };