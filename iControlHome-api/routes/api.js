const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require('bcryptjs');

router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Họ tên không được bỏ trống" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại không được bỏ trống" });
    }
    if (!password) {
      return res.status(400).json({ message: "Mật khẩu không được bỏ trống" });
    }

    // Kiểm tra dấu cách trong số điện thoại và mật khẩu
    const spaceRegex = /\s/;
    if (spaceRegex.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không được chứa dấu cách" });
    }
    if (spaceRegex.test(password)) {
      return res.status(400).json({ message: "Mật khẩu không được chứa dấu cách" });
    }

    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không đúng định dạng (phải có 10 số)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(), // Xóa khoảng trắng thừa ở đầu/cuối tên
      phone,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại không được bỏ trống" });
    }
    if (!password) {
      return res.status(400).json({ message: "Mật khẩu không được bỏ trống" });
    }

    // Chặn dấu cách khi đăng nhập
    const spaceRegex = /\s/;
    if (spaceRegex.test(phone) || spaceRegex.test(password)) {
      return res.status(400).json({ message: "Tài khoản hoặc mật khẩu không được chứa dấu cách" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu không chính xác" });
    }

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(200).json({ message: "Đăng nhập thành công", user: userSafe });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;