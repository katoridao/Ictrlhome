const express = require("express");
const router = express.Router();
const User = require("../models/User");

// GET all users
router.get("/user-getall", async (req, res) => {
  try {
    const users = await User.find({});
    res.json({
      status: 200,
      message: "Fetch successfully",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      message: "Lỗi server",
      error: error.message,
    });
  }
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }
    const newUser = new User({
      name,
      phone,
      password,
    });

    await newUser.save();
    res.status(200).json({ message: "Đăng ký thành công" });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.phone) {
      return res.status(400).json({ message: "Số điện thoại đã được đăng ký" });
    }
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(200).json({ message: "Đăng nhập thành công", user: userSafe });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
});

module.exports = router;
