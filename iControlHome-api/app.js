var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
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
const apiRouter = require("./routes/api"); // Chứa Login, Register, Profile, v.v.

var app = express();

// KẾT NỐI DATABASE
db.connect();

// VIEW ENGINE SETUP
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");

// MIDDLEWARE HỆ THỐNG
app.use(cors()); // Phải để trên cùng để không bị lỗi Network Error ở App
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

/**
 * PHÂN LUỒNG ROUTE
 */

// A. Route hệ thống (Login, Register nằm trong apiRouter)
// Lưu ý: apiRouter bên trong nó KHÔNG được dùng authenticate cho login/register
app.use("/api", apiRouter);

// B. Route thông báo (Lấy lịch sử hoạt động)
app.get("/api/notifications", authenticate, async (req, res) => {
  try {
    // Lấy 50 thông báo mới nhất liên quan đến User này
    // populate('user_id', 'name') nếu bạn muốn hiển thị tên người liên quan
    const notes = await Notification.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .limit(50);
    res.json(notes);
  } catch (error) {
    console.error("Lỗi Notifications:", error.message);
    res.status(500).json({ message: "Lỗi lấy danh sách thông báo" });
  }
});

// C. Route tài nguyên (Tất cả đều được bảo vệ bởi authenticate)
app.use("/api/houses", authenticate, houseRoutes);
app.use("/api/rooms", authenticate, roomRoutes);
app.use("/api/devices", authenticate, deviceRoutes);
app.use("/api/device-logs", authenticate, deviceLogRoutes);
app.use("/api/device-usages", authenticate, deviceUsageRoutes);
app.use("/api/automations", authenticate, automationRoutes);

/**
 * KHỞI CHẠY TỰ ĐỘNG HÓA (WORKER)
 */
try {
    initAutomationWorker();
    console.log("[Worker] Hệ thống tự động hóa đã sẵn sàng.");
} catch (error) {
    console.error("[Worker Error] Không thể khởi động Worker:", error.message);
}

// CẤU HÌNH LỖI 404
app.use(function (req, res, next) {
  console.log(`[404 Error] Không tìm thấy: ${req.method} ${req.url}`);
  next(createError(404));
});

// CẤU HÌNH ERROR HANDLER CHUNG
app.use(function (err, req, res, next) {
  // Log lỗi chi tiết ở server để debug
  console.error(`[Server Error] ${err.status || 500} - ${err.message}`);
  
  res.status(err.status || 500);
  res.json({
    message: err.message,
    // Chỉ hiện lỗi chi tiết khi ở môi trường development
    error: req.app.get("env") === "development" ? err : {},
  });
});

module.exports = app;