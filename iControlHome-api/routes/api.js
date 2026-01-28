const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

router.post("/register", async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Họ tên không được bỏ trống" });
    }
    if (!phone) {
      return res.status(400).json({ message: "Số điện thoại không được bỏ trống" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email không được bỏ trống" });
    }
    if (!password) {
      return res.status(400).json({ message: "Mật khẩu không được bỏ trống" });
    }

    const spaceRegex = /\s/;
    if (spaceRegex.test(phone) || spaceRegex.test(email) || spaceRegex.test(password)) {
      return res.status(400).json({ message: "Thông tin không được chứa dấu cách" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Email không đúng định dạng" });
    }

    const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không đúng định dạng (phải có 10 số)" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email này đã được đăng ký" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại này đã được đăng ký" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name: name.trim(),
      phone,
      email: email.toLowerCase(),
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

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Vui lòng nhập email" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Email này chưa được đăng ký" });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'adicontrolhome@gmail.com',
        pass: 'hwfi gltd itxc rlnj'
      }
    });

    const mailOptions = {
      from: 'iCtrlHome <EMAIL_CUA_BAN@gmail.com>',
      to: email,
      subject: 'Đặt lại mật khẩu iCtrlHome',
      text: `Mật khẩu mới của bạn là: ${newPassword}. Vui lòng đăng nhập và đổi mật khẩu ngay.`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Mật khẩu mới đã được gửi đến email của bạn" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const { phone, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ phone });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không đúng" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});
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