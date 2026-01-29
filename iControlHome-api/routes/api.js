const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require('bcryptjs');

// ĐĂNG KÝ
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    // Kiểm tra trống
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Họ tên không được bỏ trống" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại không được bỏ trống" });
    }
    if (!password) {
      return res.status(400).json({ message: "Mật khẩu không được bỏ trống" });
    }

    // Kiểm tra dấu cách
    const spaceRegex = /\s/;
    if (spaceRegex.test(phone) || spaceRegex.test(password)) {
      return res.status(400).json({ message: "Thông tin không được chứa dấu cách" });
    }

    // Kiểm tra định dạng số điện thoại (Việt Nam)
    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không đúng định dạng (phải có 10 số)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    // Kiểm tra số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      phone,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({ message: "Đăng ký thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// ĐĂNG NHẬP
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Số điện thoại không tồn tại" });
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


router.post("/forgot-password", async (req, res) => {
  try {
    const { phone, newPassword, confirmPassword } = req.body;

    if (!phone || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu xác nhận không khớp" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Số điện thoại này chưa được đăng ký" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// ĐỔI MẬT KHẨU
router.post("/change-password", async (req, res) => {
  try {
    const { phone, oldPassword, newPassword } = req.body;

    if (!phone || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

module.exports = router;