var createError = require("http-errors");
var express = require("express");
var path = require("path");
var fs = require("fs");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var http = require("http");
var { Server } = require("socket.io");

const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, ".env.example");

require("dotenv").config({
  path: fs.existsSync(envPath) ? envPath : envExamplePath,
});

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.warn(
    "[env] Không tìm thấy file .env, hệ thống đang tạm dùng .env.example. Hãy copy .env.example thành .env và điền cấu hình thật nếu cần.",
  );
}

// 1. IMPORT DATABASE & WORKER
const db = require("./config/database");
const { initAutomationWorker } = require("./services/smartService");
const {
  initDeviceStatusMonitor,
  initConsumptionThresholdMonitor,
} = require("./services/notificationService");
const Device = require("./models/Device");
const DeviceUsage = require("./models/DeviceUsage");
const User = require("./models/User");
const House = require("./models/House");
const jwt = require("jsonwebtoken");

// 2. IMPORT MODELS & MIDDLEWARE
const Notification = require("./models/Notification");
const { authenticate } = require("./middlewares/auth");

// 3. IMPORT ROUTES
const houseRoutes = require("./routes/house");
const roomRoutes = require("./routes/room");
const deviceRoutes = require("./routes/device");
const deviceLogRoutes = require("./routes/deviceLog");
const deviceUsageRoutes = require("./routes/deviceUsage");
const automationRoutes = require("./routes/automation");
const apiRouter = require("./routes/api");
const detectionRoutes = require("./routes/detection");
const facesRoutes = require("./routes/faces");

var app = express();

// KẾT NỐI DATABASE
db.connect();

// Tạo HTTP server cho Socket.IO
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Gắn io vào app
app.set("io", io);
// Một số route/service đang dùng global.io để emit
global.io = io;

// ===============================
// REALTIME EMITTER: device-runtime
// - 1 interval duy nhất cho toàn server (không tạo theo từng client)
// - payload giống API /device-usages/realtime
// ===============================
let runtimeEmitterTimer = null;

const buildRealtimeDevicePayload = async () => {
  const devices = await Device.find();

  const result = await Promise.all(
    devices.map(async (device) => {
      const deviceIsOn = !!device.status;

      const closedUsages = await DeviceUsage.find({
        device_id: device._id,
        end_time: { $ne: null },
      });

      let totalSeconds = 0;
      let totalEnergy = 0;

      closedUsages.forEach((u) => {
        const durationMinutes =
          typeof u.duration_minutes === "number" && u.duration_minutes > 0
            ? u.duration_minutes
            : (new Date(u.end_time) - new Date(u.start_time)) / (1000 * 60);
        totalSeconds += Math.floor(durationMinutes * 60);
        totalEnergy += u.energy_kwh || 0;
      });

      const openUsage = await DeviceUsage.findOne({
        device_id: device._id,
        end_time: null,
      }).sort({ start_time: -1 });

      let isActive = false;

      if (openUsage && deviceIsOn) {
        const runtimeNow = Math.floor(
          (Date.now() - new Date(openUsage.start_time)) / 1000,
        );
        totalSeconds += runtimeNow;
        totalEnergy += (device.power_watt * runtimeNow) / 3600000;
        isActive = true;
      }

      return {
        device_id: device._id,
        house_id: device.house_id || "H001",
        device_name: device.name,
        power_watt: device.power_watt,
        runtime_seconds: totalSeconds,
        energy_kwh: totalEnergy,
        estimated_runtime_seconds: totalSeconds,
        estimated_energy_kwh: totalEnergy,
        estimation_basis: "configured_power_and_runtime",
        is_estimated: true,
        isActive,
      };
    }),
  );

  return result;
};

const startRuntimeEmitter = () => {
  if (runtimeEmitterTimer) return;

  runtimeEmitterTimer = setInterval(async () => {
    try {
      // Nếu không có ai connect thì khỏi tốn query DB
      if (io.engine.clientsCount === 0) return;

      const devices = await buildRealtimeDevicePayload();
      const devicesByHouse = devices.reduce((acc, device) => {
        const houseId = String(device.house_id || "H001");
        if (!acc[houseId]) acc[houseId] = [];
        acc[houseId].push(device);
        return acc;
      }, {});

      Object.entries(devicesByHouse).forEach(([houseId, payload]) => {
        io.to(houseId).emit("device-runtime", payload);
      });
    } catch (err) {
      console.log("[Realtime] emit device-runtime error:", err.message);
    }
  }, 1000);
};

io.use(async (socket, next) => {
  try {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");
    const token = String(rawToken || "").trim();

    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(new Error("Missing JWT secret"));
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded._id || decoded.id);

    if (!user) {
      return next(new Error("Unauthorized"));
    }

    socket.data.user = user;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  console.log(`[Socket] Client kết nối: ${socket.id}`);
  startRuntimeEmitter();

  if (socket.data?.user?._id) {
    socket.join(`user:${socket.data.user._id.toString()}`);
  }

  socket.on("join_house", async ({ house_id }) => {
    if (!house_id || !socket.data?.user) return;

    try {
      const normalizedHouseId = String(house_id);

      if (socket.data.user.role !== "OWNER") {
        const house = await House.findById(normalizedHouseId);
        const isMember = house
          ? house.members.some(
              (member) => member.toString() === socket.data.user._id.toString(),
            )
          : false;

        if (!isMember) {
          socket.emit("house_join_denied", {
            house_id: normalizedHouseId,
          });
          return;
        }
      }

      socket.join(normalizedHouseId);
      const roomSize =
        io.sockets.adapter.rooms.get(normalizedHouseId)?.size || 0;

      console.log(
        `[Socket] ${socket.id} join house ${normalizedHouseId} (${roomSize} clients)`,
      );
    } catch (error) {
      console.log("[Socket] join_house denied:", error.message);
    }
  });

  socket.on("leave_house", ({ house_id }) => {
    if (!house_id) return;

    socket.leave(house_id);
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Client disconnect: ${socket.id}`);
  });
});

// VIEW ENGINE
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// MIDDLEWARE
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/**
 * ROUTES
 */

// Login Register
app.use("/api", apiRouter);

// Notifications
app.get("/api/notifications", authenticate, async (req, res) => {
  try {
    const notes = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách thông báo" });
  }
});

app.get("/api/notifications/estimated-cost-threshold-logs", authenticate, async (req, res) => {
  try {
    const houseId = String(req.query?.house_id || "H001");
    const period = String(req.query?.period || "").toLowerCase();
    const monthKey = String(req.query?.month_key || "").trim();

    const house = await House.findById(houseId).select("owner_id members");
    if (!house) {
      return res.status(404).json({ message: "Không tìm thấy hộ gia đình" });
    }

    const isOwner = house.owner_id?.toString() === req.user._id.toString();
    const isMember = (house.members || []).some(
      (member) => member.toString() === req.user._id.toString(),
    );

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: "Bạn không có quyền xem dữ liệu này" });
    }

    const baseMatch = {
      user_id: req.user._id,
      house_id: houseId,
      type: "SYSTEM",
      $or: [
        { "data.localization_key": "estimated_cost_threshold" },
        { "data.localization_key": "consumption_estimate_threshold" },
      ],
    };

    const now = new Date();
    if (period === "week") {
      const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      baseMatch.created_at = { $gte: since };
    } else if (period === "month" && monthKey) {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr);
      if (Number.isInteger(year) && Number.isInteger(month) && month >= 1 && month <= 12) {
        const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const end = new Date(year, month, 1, 0, 0, 0, 0);
        baseMatch.created_at = { $gte: start, $lt: end };
      }
    }

    const logs = await Notification.find(baseMatch).sort({ created_at: -1 }).limit(300);

    const monthKeys = Array.from(
      new Set(
        logs
          .map((item) => String(item?.data?.month_key || ""))
          .filter(Boolean),
      ),
    ).sort((a, b) => (a > b ? -1 : 1));

    return res.json({
      logs,
      month_keys: monthKeys,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi lấy log vượt ngưỡng chi phí" });
  }
});

// Protected routes
app.use("/api/houses", authenticate, houseRoutes);
app.use("/api/rooms", authenticate, roomRoutes);
app.use("/api/devices", authenticate, deviceRoutes);
app.use("/api/device-logs", authenticate, deviceLogRoutes);
app.use("/api/device-usages", authenticate, deviceUsageRoutes);
app.use("/api/automations", authenticate, automationRoutes);
app.use("/api/camera", detectionRoutes);
app.use("/api/camera", facesRoutes);

/**
 * KHỞI CHẠY AUTOMATION WORKER
 */
try {
  initAutomationWorker();
  initDeviceStatusMonitor();
  initConsumptionThresholdMonitor();
  console.log("[Worker] Automation worker started");
} catch (error) {
  console.error("[Worker Error]", error.message);
}

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = { app, httpServer };
