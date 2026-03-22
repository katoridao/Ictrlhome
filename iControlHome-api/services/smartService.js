const cron = require("node-cron");
const Automation = require("../models/Automation");
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const { createNotification } = require("./notificationService");
const moment = require("moment");

const initAutomationWorker = () => {
  cron.schedule("* * * * *", async () => {
    try {
      // 1. Lấy giờ Việt Nam
      const vnTime = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }),
      );
      const currentTimeHM = moment(vnTime).format("HH:mm");
      const currentFullTime = moment(vnTime).format("YYYY-MM-DD HH:mm");

      console.log(`[Worker] Quét: ${currentFullTime}`);

      // 2. Tìm kịch bản (khớp cả 2 định dạng)
      const tasks = await Automation.find({
        enabled: true,
        $or: [
          { trigger_time: currentTimeHM },
          { trigger_time: currentFullTime },
        ],
      }).populate("device_id");

      for (const task of tasks) {
        if (!task.device_id) continue;
        const device = task.device_id;
        const shouldBeOn = task.action === "ON";

        // 3. Cập nhật DB
        await Device.findByIdAndUpdate(device._id, { status: shouldBeOn });

        // 3.1 Ghi log lịch sử để màn Device Log hiển thị hành động tự động hoá
        await DeviceLog.create({
          device_id: device._id,
          user_id: task.user_id || null,
          house_id: device.house_id || "H001",
          action: shouldBeOn ? "ON" : "OFF",
        });

        // 4. GỬI LỆNH THỰC TẾ (Sửa theo Socket.io của bạn)
        if (global.io) {
          global.io.emit("device_control", {
            esp32_id: device.esp32_id,
            status: shouldBeOn,
          });

          // Emit cho app để cập nhật realtime trạng thái thiết bị.
          global.io
            .to(device.house_id || "H001")
            .emit("device_status_changed", {
              device_id: device._id.toString(),
              status: shouldBeOn,
              house_id: device.house_id || "H001",
            });

          // Trigger refresh for screens listening to generic device log updates.
          global.io.emit("device-update");

          console.log(
            `[SOCKET] Đã gửi lệnh ${task.action} tới ${device.esp32_id}`,
          );
        }

        // 5. Thông báo & Tắt kịch bản nếu chạy 1 lần
        const logMsg = `Tự động: Đã ${shouldBeOn ? "BẬT" : "TẮT"} ${device.name}`;
        if (task.user_id) await createNotification(task.user_id, logMsg);

        if (task.repeat_type === "ONCE") {
          if (task.auto_delete_on_trigger) {
            await Automation.findByIdAndDelete(task._id);
            console.log(
              `[Worker] Xoá automation ${task.name} vì auto_delete = true`,
            );
          } else {
            await Automation.findByIdAndUpdate(task._id, { enabled: false });
          }
        } else if (task.auto_delete_on_trigger) {
          // Nếu không phải ONCE nhưng vẫn auto_delete, cũng xoá
          await Automation.findByIdAndDelete(task._id);
          console.log(
            `[Worker] Xoá automation ${task.name} (${task.repeat_type}) vì auto_delete = true`,
          );
        }
      }
    } catch (err) {
      console.error("❌ Lỗi Worker:", err.message);
    }
  });
};

module.exports = { initAutomationWorker };
