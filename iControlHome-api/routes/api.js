const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticate } = require("../middlewares/auth"); // Import để bảo vệ route

const JWT_SECRET = process.env.JWT_SECRET || "smart_home_secret_key";

// 1. UPDATE PROFILE (Thêm authenticate)
router.post("/update-profile", authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    // Lấy user trực tiếp từ req.user do authenticate cung cấp
    const user = await User.findById(req.user._id);

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên không được để trống" });
    }

    user.name = name.trim();
    await user.save();

    res.json({ message: "Cập nhật thành công", user });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 2. REGISTER (Giữ nguyên logic của bạn nhưng trim dữ liệu kỹ hơn)
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
      settings: { theme: "LIGHT", language: "VI" },
    });

    await newUser.save();
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3. LOGIN (Sửa house_id để không bị lỗi Network Error/DB Error)

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone: phone.trim() });

    if (!user) return res.status(404).json({ message: "Sai số điện thoại" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu" });

    // QUAN TRỌNG: Key phải là "id" để khớp với middleware auth.js
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "Đăng nhập thành công",
      token,
<<<<<<< HEAD
      user: { _id: user._id, name: user.name, phone: user.phone, role: user.role }
=======
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        settings: user.settings,
      },
>>>>>>> main
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// 3.1 UPDATE USER SETTINGS (theme/language) - per account sync
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
// 4. CHANGE PASSWORD (Bắt buộc dùng authenticate)
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
