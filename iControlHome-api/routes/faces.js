const express = require("express");
const router = express.Router();

const Face = require("../models/Face");
const House = require("../models/House");

const {
  authenticate,
  isOwner,
  checkHouseMembership,
} = require("../middlewares/auth");

// Token de camera/cpu client gọi API đăng ký/xuất ảnh.
// Luu y: đây là token runtime (khởi động lại server thì reset). Bạn cũng có thể set env FACE_DEVICE_TOKEN.
let deviceFaceToken = "";

const getDeviceToken = () => {
  return process.env.FACE_DEVICE_TOKEN || deviceFaceToken || "";
};

const requireDeviceAuth = (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : "";
  const expected = getDeviceToken();

  if (!expected) {
    return res.status(403).json({
      message: "Thiếu FACE_DEVICE_TOKEN (hoặc chưa set /save-device-token)",
    });
  }

  if (!token || token !== expected) {
    return res.status(401).json({ message: "Device token không hợp lệ" });
  }

  next();
};

const getHouseIdForUser = async (user) => {
  if (!user) return null;

  if (user.role === "OWNER") {
    const house = await House.findOne({ owner_id: user._id });
    return house?._id?.toString?.() || null;
  }

  const house = await House.findOne({
    members: { $elemMatch: { $eq: user._id } },
  });
  return house?._id?.toString?.() || null;
};

// =========================
// CAMERA/DEVICE API
// =========================

// App có thể gọi endpoint này để set token cho camera.
router.post("/save-device-token", (req, res) => {
  try {
    deviceFaceToken = req.body?.token || "";
    res.json({ message: "Device face token saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Xuất danh sách face (cho camera.py load known_faces)
router.get("/faces/export", requireDeviceAuth, async (req, res) => {
  try {
    const house_id = req.query?.house_id ? String(req.query.house_id) : "H001";
    const faces = await Face.find({ house_id })
      .sort({ createdAt: -1 })
      .select("name image encoding house_id");
    res.json({ faces });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Đăng ký 1 face (camera.py gửi lên)
router.post("/faces/register", requireDeviceAuth, async (req, res) => {
  try {
    const { name, image, house_id, encoding } = req.body || {};
    if (!name || !image) {
      return res.status(400).json({ message: "Thiếu name hoặc image" });
    }

    const normalizedName = String(name).trim();
    const normalizedHouseId = house_id ? String(house_id) : "H001";

    // Owner dùng cho đúng model (giữ đơn giản: lấy owner của house)
    const house = await House.findById(normalizedHouseId);
    if (!house) return res.status(404).json({ message: "House không tồn tại" });

    // Chặn trùng tên: mỗi tên chỉ 1 khuôn mặt
    const existingName = await Face.findOne({
      house_id: normalizedHouseId,
      name: { $regex: `^${normalizedName}$`, $options: "i" },
    });
    if (existingName) {
      return res.status(409).json({
        message: `Tên "${normalizedName}" đã được đăng ký. Mỗi khuôn mặt chỉ được một tên duy nhất.`,
      });
    }

    // Chặn trùng khuôn mặt: so encoding với tất cả face trong nhà
    if (Array.isArray(encoding) && encoding.length === 128) {
      const allFaces = await Face.find({
        house_id: normalizedHouseId,
        encoding: { $exists: true, $ne: [] },
      });
      for (const existingFace of allFaces) {
        const dist = faceDistance(encoding, existingFace.encoding);
        if (dist <= 0.45) {
          return res.status(409).json({
            message: `Khuôn mặt này đã được đăng ký với tên "${existingFace.name}". Một khuôn mặt chỉ có một tên duy nhất.`,
          });
        }
      }
    }

    const face = new Face({
      name: normalizedName,
      image,
      house_id: normalizedHouseId,
      owner_id: house.owner_id,
      encoding: Array.isArray(encoding) ? encoding : [],
    });
    await face.save();

    res.json({ message: "Registered face", face });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Tên đã tồn tại trong hệ thống." });
    }
    res.status(500).json({ error: "Server error" });
  }
});

// Hàm tính khoảng cách Euclidean giữa 2 face encoding
function faceDistance(enc1, enc2) {
  if (!enc1 || !enc2 || enc1.length !== enc2.length) return 1.0;
  const sum = enc1.reduce((acc, v, i) => acc + Math.pow(v - enc2[i], 2), 0);
  return Math.sqrt(sum);
}

// =========================
// APP (AUTH) MANAGEMENT API
// =========================

// List faces của nhà người đang đăng nhập
router.get("/faces", authenticate, checkHouseMembership, async (req, res) => {
  try {
    if (!req.isHouseMember) {
      return res.json({ faces: [] });
    }

    const house_id = req.houseId || (await getHouseIdForUser(req.user));
    if (!house_id) {
      return res.json({ faces: [] });
    }

    const faces = await Face.find({ house_id })
      .sort({ createdAt: -1 })
      .select("name image createdAt");
    res.json({ faces });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Xóa face (chỉ OWNER hoặc MEMBER có thể xóa theo mong muốn)
// Ở đây mình để OWNER mới được xóa để tránh lạm dụng.
router.delete("/faces/:id", authenticate, isOwner, async (req, res) => {
  try {
    const face = await Face.findByIdAndDelete(req.params.id);
    if (!face) return res.status(404).json({ message: "Face không tồn tại" });
    res.json({ message: "Deleted face" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
