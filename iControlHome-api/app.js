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
  console.log(`[Socket] ✅ Client kết nối: ${socket.id}`);

  // DEBUG: log tất cả rooms hiện tại khi có client mới connect
  const allRooms = [...io.sockets.adapter.rooms.keys()].filter(r => !r.startsWith('/'));
  console.log(`[Socket] Tổng clients đang kết nối: ${io.sockets.sockets.size}`);
  console.log(`[Socket] Các rooms hiện tại:`, [...io.sockets.adapter.rooms.entries()].map(([k,v]) => `${k}(${v.size})`).join(', ') || 'trống');

  socket.on("join_house", ({ house_id }) => {
    if (!house_id) {
      console.log(`[Socket] ❌ ${socket.id} gọi join_house nhưng house_id = null/undefined`);
      return;
    }
    socket.join(house_id);
    const roomSize = io.sockets.adapter.rooms.get(house_id)?.size || 0;
    console.log(`[Socket] ✅ ${socket.id} đã join house: ${house_id} — tổng trong room: ${roomSize}`);
  });

  socket.on("leave_house", ({ house_id }) => {
    if (!house_id) return;
    socket.leave(house_id);
    const roomSize = io.sockets.adapter.rooms.get(house_id)?.size || 0;
    console.log(`[Socket] ${socket.id} đã leave house: ${house_id} — còn lại: ${roomSize}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] ❌ Client ngắt kết nối: ${socket.id} — lý do: ${reason}`);
    console.log(`[Socket] Còn lại: ${io.sockets.sockets.size} clients`);
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