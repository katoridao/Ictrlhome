var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var http = require("http");
var { Server } = require("socket.io");
require("dotenv").config();

// Import Database
const db = require("./config/database");
db.connect();

// Import Middleware
const { authenticate } = require("./middlewares/auth");

// Import Routes
const houseRoutes = require("./routes/house");
const roomRoutes = require("./routes/room");
const deviceRoutes = require("./routes/device");
const deviceLogRoutes = require("./routes/deviceLog");
const deviceUsageRoutes = require("./routes/deviceUsage");
const apiRouter = require("./routes/api");

var app = express();

// Tạo HTTP server từ app để Socket.IO dùng chung cổng
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Gắn io vào app để dùng trong các route
app.set("io", io);

io.on("connection", (socket) => {
  console.log("[Socket] Client kết nối:", socket.id);

  socket.on("disconnect", () => {
    console.log("[Socket] Client ngắt kết nối:", socket.id);
  });
});

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// Middleware cơ bản
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/**
 * PHÂN LUỒNG ROUTE
 */

// 1. Các route tài nguyên (Cần đăng nhập mới được truy cập)
app.use("/api/houses", authenticate, houseRoutes);
app.use("/api/rooms", authenticate, roomRoutes);
app.use("/api/devices", authenticate, deviceRoutes);
app.use("/api/device-logs", authenticate, deviceLogRoutes);
app.use("/api/device-usages", authenticate, deviceUsageRoutes);

// 2. Các route hệ thống (Bao gồm Login, Register không cần authenticate ở đây)
app.use("/api", apiRouter);

// 404 handler
app.use(function (req, res, next) {
  console.log(`[404 Error] Không tìm thấy: ${req.method} ${req.url}`);
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

// Export httpServer thay vì app để lắng nghe được Socket.IO
module.exports = { app, httpServer };