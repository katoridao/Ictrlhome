const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "smart_home_secret_key";

// update profile
router.post("/update-profile", async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Thiếu số điện thoại" });
    }

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Tên không được để trống" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { phone },
      { name: name.trim() },
      { new: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật thành công",
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        settings: updatedUser.settings,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// update setting
router.post("/update-settings", async (req, res) => {
  try {
    const { phone, theme, language } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    if (theme) user.settings.theme = theme;
    if (language) user.settings.language = language;

    await user.save();

    res.json({
      message: "Cập nhật cài đặt thành công",
      settings: user.settings,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// register
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
    }

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
      },
    });

    await newUser.save();

    res.status(201).json({
      message: "Đăng ký thành công",
      user: {
        _id: newUser._id,
        name: newUser.name,
        phone: newUser.phone,
        role: newUser.role,
        settings: newUser.settings,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi server" });
  }
});

// login — FIX: tạo và trả về JWT token
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    // FIX: Tạo JWT token chứa _id và role của user
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Đăng nhập thành công",
      token, // FIX: trả token về cho client lưu
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        settings: user.settings,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// forgot pass
router.post("/forgot-password", async (req, res) => {
  try {
    const { phone, newPassword, confirmPassword } = req.body;

    if (!phone || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu không khớp" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

// change pass
router.post("/change-password", async (req, res) => {
  try {
    const { phone, oldPassword, newPassword } = req.body;

    if (!phone || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ sai" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;