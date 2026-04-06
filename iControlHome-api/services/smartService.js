const cron = require("node-cron");
const Automation = require("../models/Automation");
const Device = require("../models/Device");
const DeviceLog = require("../models/DeviceLog");
const DeviceUsage = require("../models/DeviceUsage");
const {
  notifyAutomationTriggered,
  notifyDeviceOffline,
} = require("./notificationService");
const moment = require("moment");

// Gọi HTTP trực tiếp tới ESP32 (giống route device.js)
const normalizeEsp32Url = (hostOrIp, on) => {
  const raw = String(hostOrIp || "").trim();
  if (!raw) return null;
  const hasScheme = raw.startsWith("http://") || raw.startsWith("https://");
  const base = hasScheme ? raw : `http://${raw}`;
  return `${base}${on ? "/on" : "/off"}`;
};

const callEsp32 = async ({ esp32_ip, on, timeoutMs = 8000 }) => {
  const url = normalizeEsp32Url(esp32_ip, on);
  if (!url) return { ok: true, skipped: true };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    const text = await res.text().catch(() => "");
    clearTimeout(timer);
    return res.ok ? { ok: true } : { ok: false, status: res.status, text };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, error: e?.message || String(e) };
  }
};

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
      })
        .populate("device_id")
        .populate("user_id", "name");

      for (const task of tasks) {
        if (!task.device_id) continue;
        const device = task.device_id;
        const shouldBeOn = task.action === "ON";

        // 3. Cập nhật DB
        await Device.findByIdAndUpdate(device._id, { status: shouldBeOn });

        // 3.2 Cập nhật DeviceUsage (giống manual toggle)
        const now = new Date();
        if (shouldBeOn) {
          const existed = await DeviceUsage.findOne({
            device_id: device._id,
            end_time: null,
          });
          if (!existed) {
            await DeviceUsage.create({
              device_id: device._id,
              start_time: now,
            });
          }
        } else {
          const lastUsage = await DeviceUsage.findOne({
            device_id: device._id,
            end_time: null,
          }).sort({ start_time: -1 });
          if (lastUsage) {
            const durationMs = now - lastUsage.start_time;
            const runtimeSeconds = Math.floor(durationMs / 1000);
            lastUsage.end_time = now;
            lastUsage.duration_minutes =
              Math.round((durationMs / (1000 * 60)) * 100) / 100;
            lastUsage.energy_kwh =
              (device.power_watt * runtimeSeconds) / 3600000;
            await lastUsage.save();
          }
        }

        // 3.3 Ghi log lịch sử để màn Device Log hiển thị hành động tự động hoá
        await DeviceLog.create({
          device_id: device._id,
          user_id: task.user_id?._id || task.user_id || null,
          house_id: device.house_id || "H001",
          action: shouldBeOn ? "ON" : "OFF",
        });

        // 4. GỬI LỆNH THỰC TẾ TỚI ESP32 QUA HTTP
        if (device.esp32_ip) {
          const esp32Result = await callEsp32({
            esp32_ip: device.esp32_ip,
            on: shouldBeOn,
          });
          if (!esp32Result.ok && !esp32Result.skipped) {
            console.warn(
              `[Worker] ESP32 ${device.esp32_ip} không phản hồi:`,
              esp32Result,
            );
            await Device.findByIdAndUpdate(device._id, {
              connectivity_status: "OFFLINE",
            });
            await notifyDeviceOffline({
              houseId: device.house_id || "H001",
              deviceName: device.name,
              deviceId: device._id,
            });
          } else {
            await Device.findByIdAndUpdate(device._id, {
              connectivity_status: "ONLINE",
              last_seen_at: new Date(),
            });
            console.log(
              `[Worker] Đã gửi lệnh HTTP ${task.action} tới ESP32 (${device.esp32_ip})`,
            );
          }
        }

        // 5. Emit socket cho app để cập nhật realtime trạng thái thiết bị
        if (global.io) {
          global.io
            .to(device.house_id || "H001")
            .emit("device_status_changed", {
              device_id: device._id.toString(),
              status: shouldBeOn,
              house_id: device.house_id || "H001",
            });

          // Trigger refresh for screens listening to generic device log updates.
          global.io.emit("device-update");
        }

        // 6. Gửi thông báo cho cả nhà & Tắt kịch bản nếu chạy 1 lần
        await notifyAutomationTriggered({
          houseId: device.house_id || "H001",
          automationName: task.name,
          deviceName: device.name,
          status: shouldBeOn,
          actorName: task.user_id?.name || "Hệ thống",
        });

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
