const Notification = require('../models/Notification');

const createNotification = async (userId, msg) => {
  try {
    if (!userId) return;
    await Notification.create({
      user_id: userId,
      title: "Tự động hóa",
      message: msg,
      type: "AUTOMATION",
      is_read: false,
      created_at: new Date()
    });
    console.log(`[Noti] Đã gửi thông báo cho User: ${userId}`);
  } catch (err) {
    console.error("❌ Lỗi tạo thông báo:", err.message);
  }
};

module.exports = { createNotification };