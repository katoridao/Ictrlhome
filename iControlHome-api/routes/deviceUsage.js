const express = require("express");
const router = express.Router();

const DeviceUsage = require("../models/DeviceUsage");
const Device = require("../models/Device");
const {
  authenticate,
  canControlDevice,
  checkHouseMembership,
} = require("../middlewares/auth");

router.post(
  "/device-on/:deviceId",
  authenticate,
  checkHouseMembership,
  canControlDevice,
  async (req, res) => {
    try {
      const deviceId = req.params.deviceId;

      const device = await Device.findById(deviceId);

      if (!device) {
        return res.status(404).json({
          message: "Device not found",
        });
      }

      const running = await DeviceUsage.findOne({
        device_id: deviceId,
        end_time: null,
      });

      if (running) {
        return res.json({
          message: "Device already running",
        });
      }

      // Đồng bộ trạng thái thiết bị: bật mới coi là đang chạy
      if (!device.status) {
        device.status = true;
        await device.save();
      }

      const usage = new DeviceUsage({
        device_id: deviceId,
        start_time: new Date(),
      });

      await usage.save();

      // 🔥 emit socket update ngay cho đúng house
      global.io?.to(String(device.house_id || "H001")).emit("device-update", {
        house_id: device.house_id || "H001",
      });

      res.json({
        message: "Device turned ON",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

router.post(
  "/device-off/:deviceId",
  authenticate,
  checkHouseMembership,
  canControlDevice,
  async (req, res) => {
    try {
      const deviceId = req.params.deviceId;

      const usage = await DeviceUsage.findOne({
        device_id: deviceId,
        end_time: null,
      }).populate("device_id");

      if (!usage) {
        return res.status(404).json({
          message: "Device not running",
        });
      }

      const now = new Date();

      const runtime = Math.floor((now - usage.start_time) / 1000);

      const energy = (usage.device_id.power_watt * runtime) / 3600000;

      usage.end_time = now;
      usage.duration_minutes = runtime / 60;
      usage.energy_kwh = energy;

      await usage.save();

      // Đồng bộ trạng thái thiết bị: tắt thì không còn "đang chạy"
      const device = usage.device_id;
      if (device && device.status) {
        device.status = false;
        await device.save();
      }

      // 🔥 emit socket update ngay cho đúng house
      global.io?.to(String(device?.house_id || "H001")).emit("device-update", {
        house_id: device?.house_id || "H001",
      });

      res.json({
        message: "Device turned OFF",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

// ===============================
// REALTIME THỐNG KÊ
// ===============================
router.get(
  "/realtime",
  authenticate,
  checkHouseMembership,
  async (req, res) => {
    try {
      if (!req.isHouseMember) {
        return res.json({
          devices: [],
          is_estimated: true,
          note: "Bạn chưa tham gia hộ gia đình nào.",
        });
      }

      const houseId = req.houseId || "H001";
      const period = String(req.query?.period || "all").toLowerCase();
      const monthKey = String(req.query?.month_key || "").trim();
      const devices = await Device.find({ house_id: houseId });
      const now = new Date();
      let rangeStart = null;
      let rangeEnd = null;

      if (period === "day") {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        rangeEnd = now;
      } else if (period === "week") {
        rangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        rangeEnd = now;
      } else if (period === "month" && monthKey) {
        const [yearStr, monthStr] = monthKey.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);
        if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
          rangeStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
          rangeEnd = new Date(year, month, 1, 0, 0, 0, 0);
        }
      } else if (period === "month") {
        rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        rangeEnd = now;
      }

      const result = [];

      for (const device of devices) {
        const deviceIsOn = !!device.status;

        // Tổng tất cả các lần đã chạy (usage đã đóng)
        const closedUsageFilter = {
          device_id: device._id,
          end_time: { $ne: null },
        };
        if (rangeStart && rangeEnd) {
          closedUsageFilter.start_time = { $lt: rangeEnd };
          closedUsageFilter.end_time = { $gt: rangeStart };
        }
        const closedUsages = await DeviceUsage.find(closedUsageFilter);

        let totalSeconds = 0;
        let totalEnergy = 0;

        closedUsages.forEach((u) => {
          const durationMinutes =
            typeof u.duration_minutes === "number" && u.duration_minutes > 0
              ? u.duration_minutes
              : (new Date(u.end_time) - new Date(u.start_time)) / (1000 * 60);
          let seconds = Math.floor(durationMinutes * 60);
          if (rangeStart && rangeEnd) {
            const overlapStart = Math.max(
              new Date(u.start_time).getTime(),
              rangeStart.getTime(),
            );
            const overlapEnd = Math.min(
              new Date(u.end_time).getTime(),
              rangeEnd.getTime(),
            );
            seconds = overlapEnd > overlapStart
              ? Math.floor((overlapEnd - overlapStart) / 1000)
              : 0;
          }

          if (seconds <= 0) return;
          totalSeconds += seconds;
          totalEnergy += (device.power_watt * seconds) / 3600000;
        });

        // Lần đang chạy (nếu có)
        const openUsage = await DeviceUsage.findOne({
          device_id: device._id,
          end_time: null,
        }).sort({ start_time: -1 });

        let isActive = false;

        if (openUsage && deviceIsOn) {
          const openStartMs = new Date(openUsage.start_time).getTime();
          const lowerBoundMs = rangeStart ? rangeStart.getTime() : openStartMs;
          const upperBoundMs = rangeEnd ? rangeEnd.getTime() : Date.now();
          const overlapStartMs = Math.max(openStartMs, lowerBoundMs);
          const overlapEndMs = Math.min(Date.now(), upperBoundMs);
          const runtimeNow = overlapEndMs > overlapStartMs
            ? Math.floor((overlapEndMs - overlapStartMs) / 1000)
            : 0;

          if (runtimeNow > 0) {
            totalSeconds += runtimeNow;
            totalEnergy += (device.power_watt * runtimeNow) / 3600000;
            isActive = !rangeEnd || rangeEnd.getTime() >= Date.now();
          }
        }

        const runtime = totalSeconds;
        const energy = totalEnergy;

        result.push({
          device_id: device._id,
          device_name: device.name,
          power_watt: device.power_watt,
          runtime_seconds: runtime,
          energy_kwh: energy,
          estimated_runtime_seconds: runtime,
          estimated_energy_kwh: energy,
          estimation_basis: "configured_power_and_runtime",
          is_estimated: true,
          isActive,
        });
      }

      const monthsWithData = await DeviceUsage.aggregate([
        { $match: { device_id: { $in: devices.map((device) => device._id) } } },
        {
          $group: {
            _id: {
              year: { $year: "$start_time" },
              month: { $month: "$start_time" },
            },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1 } },
      ]);

      const month_keys = monthsWithData.map((item) => {
        const year = String(item._id.year);
        const month = String(item._id.month).padStart(2, "0");
        return `${year}-${month}`;
      });

      res.json({
        devices: result,
        is_estimated: true,
        period,
        month_key: monthKey || null,
        month_keys,
        note: "Các số liệu điện năng hiển thị là ước tính dựa trên công suất cấu hình và thời gian hoạt động của thiết bị.",
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

router.post(
  "/reset-statistics",
  authenticate,
  checkHouseMembership,
  async (req, res) => {
    try {
      if (req.user?.role !== "OWNER") {
        return res.status(403).json({
          message: "Chỉ chủ nhà mới có quyền reset số liệu tiêu thụ",
        });
      }

      const houseId = req.houseId || "H001";
      const devices = await Device.find({ house_id: houseId }).select(
        "_id status",
      );
      const deviceIds = devices.map((device) => device._id);

      if (!deviceIds.length) {
        return res.json({
          message: "Không có thiết bị nào để reset số liệu",
          reset_device_count: 0,
          deleted_usage_count: 0,
        });
      }

      const activeDeviceIds = devices
        .filter((device) => !!device.status)
        .map((device) => device._id);

      const deleteResult = await DeviceUsage.deleteMany({
        device_id: { $in: deviceIds },
      });

      await Device.updateMany(
        { _id: { $in: deviceIds } },
        {
          $set: {
            total_runtime_seconds: 0,
            total_energy_kwh: 0,
          },
        },
      );

      if (activeDeviceIds.length) {
        await DeviceUsage.insertMany(
          activeDeviceIds.map((deviceId) => ({
            device_id: deviceId,
            start_time: new Date(),
            end_time: null,
            duration_minutes: 0,
            energy_kwh: 0,
          })),
        );
      }

      global.io?.to(String(houseId)).emit("device-update", {
        house_id: houseId,
      });

      return res.json({
        message:
          "Đã reset toàn bộ thời gian sử dụng, điện năng và chi phí ước tính về 0",
        reset_device_count: deviceIds.length,
        deleted_usage_count: deleteResult?.deletedCount || 0,
        restarted_active_devices: activeDeviceIds.length,
      });
    } catch (error) {
      return res.status(500).json({
        error: error.message,
      });
    }
  },
);

module.exports = router;
