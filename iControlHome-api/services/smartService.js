const cron = require('node-cron');
const Automation = require('../models/Automation');
const Device = require('../models/Device');
const { createNotification } = require('./notificationService');
const moment = require('moment');

const initAutomationWorker = () => {
  cron.schedule('* * * * *', async () => {
    try {
      // 1. Lấy giờ Việt Nam
      const vnTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const currentTimeHM = moment(vnTime).format("HH:mm");
      const currentFullTime = moment(vnTime).format("YYYY-MM-DD HH:mm");

      console.log(`[Worker] Quét: ${currentFullTime}`);

      // 2. Tìm kịch bản (khớp cả 2 định dạng)
      const tasks = await Automation.find({
        enabled: true,
        $or: [
          { trigger_time: currentTimeHM },
          { trigger_time: currentFullTime }
        ]
      }).populate('device_id');

      for (const task of tasks) {
        if (!task.device_id) continue;
        const device = task.device_id;
        const shouldBeOn = task.action === "ON";

        // 3. Cập nhật DB
        await Device.findByIdAndUpdate(device._id, { status: shouldBeOn });

        // 4. GỬI LỆNH THỰC TẾ (Sửa theo Socket.io của bạn)
        if (global.io) {
          global.io.emit('device_control', {
            esp32_id: device.esp32_id,
            status: shouldBeOn
          });
          console.log(`[SOCKET] Đã gửi lệnh ${task.action} tới ${device.esp32_id}`);
        }

        // 5. Thông báo & Tắt kịch bản nếu chạy 1 lần
        const logMsg = `Tự động: Đã ${shouldBeOn ? 'BẬT' : 'TẮT'} ${device.name}`;
        if (task.user_id) await createNotification(task.user_id, logMsg);

        if (task.repeat_type === "ONCE") {
          await Automation.findByIdAndUpdate(task._id, { enabled: false });
        }
      }
    } catch (err) {
      console.error("❌ Lỗi Worker:", err.message);
    }
  });
};

module.exports = { initAutomationWorker };