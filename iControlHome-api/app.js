var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var http = require("http");
var { Server } = require("socket.io");
require("dotenv").config();

// 1. IMPORT DATABASE & WORKER
const db = require("./config/database");
const { initAutomationWorker } = require("./services/smartService");

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

io.on("connection", (socket) => {
  console.log(`[Socket] Client kết nối: ${socket.id}`);

  socket.on("join_house", ({ house_id }) => {
    if (!house_id) return;

    socket.join(house_id);
    const roomSize = io.sockets.adapter.rooms.get(house_id)?.size || 0;

    console.log(`[Socket] ${socket.id} join house ${house_id} (${roomSize} clients)`);
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

// Protected routes
app.use("/api/houses", authenticate, houseRoutes);
app.use("/api/rooms", authenticate, roomRoutes);
app.use("/api/devices", authenticate, deviceRoutes);
app.use("/api/device-logs", authenticate, deviceLogRoutes);
app.use("/api/device-usages", authenticate, deviceUsageRoutes);
app.use("/api/automations", authenticate, automationRoutes);

/**
 * KHỞI CHẠY AUTOMATION WORKER
 */
try {
  initAutomationWorker();
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