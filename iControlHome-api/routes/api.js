const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middlewares/auth");
const {
  DEFAULT_NOTIFICATION_SETTINGS,
  mergeNotificationSettings,
} = require("../services/notificationService");

const JWT_SECRET = process.env.JWT_SECRET;

const resolveUserNotificationSettings = (user) =>
  mergeNotificationSettings(
    user?.settings?.notification,
    user?.notification_settings,
  );

const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  phone: user.phone,
  role: user.role,
  settings: {
    theme: user.settings?.theme || "LIGHT",
    language: user.settings?.language || "VI",
    notification: resolveUserNotificationSettings(user),
  },
  notification_settings: resolveUserNotificationSettings(user),
});

router.post("/update-profile", authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.user._id);

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên không được để trống" });
    }

    user.name = name.trim();
    await user.save();

    res.json({ message: "Cập nhật thành công", user: buildUserPayload(user) });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password)
      return res.status(400).json({ message: "Thiếu thông tin" });

    const existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser)
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: "MEMBER",
      settings: {
        theme: "LIGHT",
        language: "VI",
        notification: DEFAULT_NOTIFICATION_SETTINGS,
      },
    });

    await newUser.save();
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone: phone.trim() });

    if (!user) return res.status(404).json({ message: "Sai số điện thoại" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Thiếu cấu hình JWT_SECRET" });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: buildUserPayload(user),
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    res.json({ user: buildUserPayload(user) });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/update-settings", authenticate, async (req, res) => {
  try {
    const { theme, language } = req.body;

    if (!theme && !language) {
      return res
        .status(400)
        .json({ message: "Thiếu dữ liệu cài đặt để cập nhật" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    if (!user.settings) user.settings = { theme: "LIGHT", language: "VI" };

    if (theme) {
      const normalizedTheme = String(theme).toUpperCase();
      if (!["LIGHT", "DARK"].includes(normalizedTheme)) {
        return res.status(400).json({ message: "Theme không hợp lệ" });
      }
      user.settings.theme = normalizedTheme;
    }

    if (language) {
      const normalizedLanguage = String(language).toUpperCase();
      if (!["VI", "EN"].includes(normalizedLanguage)) {
        return res.status(400).json({ message: "Language không hợp lệ" });
      }
      user.settings.language = normalizedLanguage;
    }

    await user.save();

    return res.json({
      message: "Cập nhật cài đặt thành công",
      settings: user.settings,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.get("/notification-settings", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    return res.json({
      notification_settings: resolveUserNotificationSettings(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/notification-settings", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    const currentSettings = resolveUserNotificationSettings(user);
    const nextSettings = { ...currentSettings };

    for (const key of Object.keys(DEFAULT_NOTIFICATION_SETTINGS)) {
      if (typeof req.body?.[key] === "boolean") {
        nextSettings[key] = req.body[key];
      }
    }

    if (!user.settings) {
      user.settings = { theme: "LIGHT", language: "VI" };
    }

    user.settings.notification = nextSettings;
    user.notification_settings = undefined;
    await user.save();

    return res.json({
      message: "Cập nhật cài đặt thông báo thành công",
      notification_settings: resolveUserNotificationSettings(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/notification-token", authenticate, async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    if (!token) {
      return res.status(400).json({ message: "Thiếu token thiết bị" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    const nextTokens = new Set([...(user.fcm_tokens || []), token]);
    user.fcm_tokens = Array.from(nextTokens);
    await user.save();

    return res.json({
      message: "Đăng ký thiết bị nhận thông báo thành công",
      token_count: user.fcm_tokens.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.delete("/notification-token", authenticate, async (req, res) => {
  try {
    const token = String(req.body?.token || "").trim();
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    user.fcm_tokens = token
      ? (user.fcm_tokens || []).filter((item) => item !== token)
      : [];

    await user.save();

    return res.json({
      message: "Đã gỡ thiết bị khỏi danh sách nhận thông báo",
      token_count: user.fcm_tokens.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server" });
  }
});

router.post("/change-password", authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ sai" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
