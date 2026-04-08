const express = require("express");
const router = express.Router();
const Automation = require("../models/Automation");
const Device = require("../models/Device");
const { authenticate, userCanControlDevice } = require("../middlewares/auth");

const getRequestedHouseId = (req) =>
  String(req.query?.house_id || req.body?.house_id || "H001");

const getAutomationOwnerId = (automation) =>
  automation?.user_id?._id || automation?.user_id || null;

const canManageAutomation = async (user, automation) => {
  if (!user?._id || !automation) return false;
  if (user.role === "OWNER") return true;

  const ownerId = getAutomationOwnerId(automation);
  if (!ownerId || ownerId.toString() !== user._id.toString()) {
    return false;
  }

  return userCanControlDevice(user, automation.device_id);
};

// 1. LẤY DANH SÁCH (Cần populate để App hiện tên thiết bị)
router.get("/", authenticate, async (req, res) => {
  try {
    const houseId = getRequestedHouseId(req);
    const list = await Automation.find({ house_id: houseId })
      .populate("device_id", "name status house_id permissions room_id")
      .populate("user_id", "name");

    if (req.user?.role === "OWNER") {
      return res.json(list);
    }

    const filtered = [];
    for (const item of list) {
      if (await canManageAutomation(req.user, item)) {
        filtered.push(item);
      }
    }

    return res.json(filtered);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 2. TẠO MỚI (PHẢI CÓ authenticate ĐỂ LẤY USER_ID)
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, device_id, action, trigger_time, repeat_type } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        message: "Không xác định được người dùng. Hãy đăng nhập lại!",
      });
    }

    const safeName = String(name || "").trim();
    if (!safeName || !device_id || !trigger_time) {
      return res.status(400).json({
        message: "Thiếu dữ liệu bắt buộc để tạo automation",
      });
    }

    const device = await Device.findById(device_id);
    if (!device) {
      return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    const canControl = await userCanControlDevice(req.user, device);
    if (!canControl) {
      return res.status(403).json({
        message:
          "Bạn chưa được cấp quyền điều khiển thiết bị này nên không thể thiết lập automation",
      });
    }

    const normalizedAction = String(action || "").toUpperCase();
    if (!["ON", "OFF"].includes(normalizedAction)) {
      return res
        .status(400)
        .json({ message: "Hành động automation không hợp lệ" });
    }

    const newAuto = new Automation({
      name: safeName,
      device_id: device._id,
      user_id: req.user._id,
      action: normalizedAction,
      trigger_time,
      house_id: device.house_id || getRequestedHouseId(req),
      repeat_type: repeat_type || "DAILY",
      enabled: true,
    });

    const savedData = await newAuto.save();
    console.log("✅ Lưu kịch bản thành công:", savedData.name);
    return res.status(201).json(savedData);
  } catch (error) {
    console.error("❌ LỖI LƯU KỊCH BẢN:", error.message);
    return res.status(400).json({
      message: "Dữ liệu không hợp lệ: " + error.message,
    });
  }
});

// 3. XOÁ KỊCH BẢN
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id).populate(
      "device_id",
      "name status house_id permissions room_id",
    );

    if (!automation) {
      return res.status(404).json({ message: "Không tìm thấy kịch bản" });
    }

    if (!(await canManageAutomation(req.user, automation))) {
      return res.status(403).json({
        message: "Bạn không có quyền xoá kịch bản cho thiết bị này",
      });
    }

    await Automation.findByIdAndDelete(req.params.id);
    return res.json({ message: "Đã xoá kịch bản" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// 3.5. CẬP NHẬT KỊCH BẢN (toggle auto_delete, v.v.)
router.put("/:id", authenticate, async (req, res) => {
  try {
    const automation = await Automation.findById(req.params.id).populate(
      "device_id",
      "name status house_id permissions room_id",
    );

    if (!automation) {
      return res.status(404).json({ message: "Không tìm thấy kịch bản" });
    }

    if (!(await canManageAutomation(req.user, automation))) {
      return res.status(403).json({
        message: "Bạn không có quyền chỉnh sửa kịch bản cho thiết bị này",
      });
    }

    const {
      auto_delete_on_trigger,
      name,
      action,
      trigger_time,
      repeat_type,
      enabled,
    } = req.body;

    const updateData = {};

    if (name !== undefined) {
      const safeName = String(name).trim();
      if (!safeName) {
        return res
          .status(400)
          .json({ message: "Tên kịch bản không được để trống" });
      }
      updateData.name = safeName;
    }

    if (action !== undefined) {
      const normalizedAction = String(action).toUpperCase();
      if (!["ON", "OFF"].includes(normalizedAction)) {
        return res
          .status(400)
          .json({ message: "Hành động automation không hợp lệ" });
      }
      updateData.action = normalizedAction;
    }

    if (trigger_time !== undefined) updateData.trigger_time = trigger_time;
    if (repeat_type !== undefined) updateData.repeat_type = repeat_type;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (auto_delete_on_trigger !== undefined) {
      updateData.auto_delete_on_trigger = auto_delete_on_trigger;
    }

    const updated = await Automation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    )
      .populate("device_id", "name status house_id permissions room_id")
      .populate("user_id", "name");

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
