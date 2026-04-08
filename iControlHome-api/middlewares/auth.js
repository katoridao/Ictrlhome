const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Device = require("../models/Device");
const Room = require("../models/Room");

const findMatchingPermission = (permissions = [], userId) => {
  if (!userId) return null;
  const normalizedUserId = userId.toString();

  return (permissions || []).find(
    (permission) => permission?.user_id?.toString() === normalizedUserId,
  );
};

const hasControlPermission = ({ userId, role, device, room }) => {
  if (!userId || !device) return false;
  if (role === "OWNER") return true;

  const roomPerm = findMatchingPermission(room?.permissions, userId);
  if (roomPerm?.can_control) return true;

  const devicePerm = findMatchingPermission(device?.permissions, userId);
  return !!devicePerm?.can_control;
};

const userCanControlDevice = async (user, deviceOrId) => {
  if (!user?._id) return false;
  if (user.role === "OWNER") return true;

  const device =
    deviceOrId && typeof deviceOrId === "object" && deviceOrId._id
      ? deviceOrId
      : await Device.findById(deviceOrId);

  if (!device) return false;

  const roomId = device.room_id?._id || device.room_id || null;
  const room = roomId ? await Room.findById(roomId) : null;

  return hasControlPermission({
    userId: user._id,
    role: user.role,
    device,
    room,
  });
};

// 1. Xác thực Token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Không có quyền truy cập, vui lòng đăng nhập" });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ message: "Thiếu cấu hình JWT_SECRET" });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, jwtSecret);

    const user = await User.findById(decoded._id || decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại" });
    }

    req.user = user;
    req.currentDevicePushToken =
      String(req.header("x-device-push-token") || "").trim() || null;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

// 2. Chỉ OWNER
const isOwner = (req, res, next) => {
  if (req.user && req.user.role === "OWNER") return next();
  return res.status(403).json({
    message: "Chỉ chủ nhà (OWNER) mới có quyền thực hiện hành động này",
  });
};

// 3. Kiểm tra quyền điều khiển thiết bị
const canControlDevice = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    const deviceId = req.params.id;

    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const roomId = device.room_id?._id || device.room_id || null;
    const room = roomId ? await Room.findById(roomId) : null;

    if (hasControlPermission({ userId, role, device, room })) {
      return next();
    }

    return res
      .status(403)
      .json({ message: "Bạn không có quyền điều khiển thiết bị này" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi kiểm tra quyền" });
  }
};

// 4. Kiểm tra quyền XEM thiết bị
const canViewDevice = async (userId, device) => {
  if (device.room_id) {
    const roomId = device.room_id?._id || device.room_id;
    const room = await Room.findById(roomId);
    if (room) {
      const roomPerm = findMatchingPermission(room.permissions, userId);
      if (roomPerm?.can_view || roomPerm?.can_control) return true;
    }
  }

  const devicePerm = findMatchingPermission(device.permissions, userId);
  return !!devicePerm?.can_control;
};

// 5. Kiểm tra user có trong house.members không
// Dùng để filter data — MEMBER chưa được thêm vào nhà sẽ nhận data rỗng
// KHÔNG chặn request, chỉ đính kèm flag req.isHouseMember để route tự xử lý
const checkHouseMembership = async (req, res, next) => {
  try {
    const user = req.user;

    // OWNER luôn là member
    if (user.role === "OWNER") {
      req.isHouseMember = true;
      return next();
    }

    const House = require("../models/House");
    const house = await House.findById("H001");

    req.isHouseMember = house
      ? house.members.some((m) => m.toString() === user._id.toString())
      : false;

    next();
  } catch (error) {
    req.isHouseMember = false;
    next();
  }
};

module.exports = {
  authenticate,
  isOwner,
  canControlDevice,
  canViewDevice,
  checkHouseMembership,
  hasControlPermission,
  userCanControlDevice,
};
